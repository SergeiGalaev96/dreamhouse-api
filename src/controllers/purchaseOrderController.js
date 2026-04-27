const { Op, Sequelize } = require("sequelize");
const sequelize = require('../config/database');
const {
  Project,
  ProjectBlock,
  Material,
  UnitOfMeasure,
  MaterialRequestItem,
  MaterialRequest,
  PurchaseOrder,
  PurchaseOrderItem
} = require('../models');
const Supplier = require('../models/Supplier');
const User = require('../models/User');
const { sendPurchaseOrderSupplierEmail } = require('../utils/mailer');
const { notifyUsers } = require('../utils/notifications');
const { sendPushToUser } = require('../utils/pushNotifications');
const updateWithAudit = require('../utils/updateWithAudit');

const PURCHASE_CREATE_ROLE_IDS = [1, 7, 10, 11];
const PURCHASE_ORDER_SUPPLIER_NOTIFICATION_TYPE = 'purchase_order_created_for_supplier';

const buildLocationLabel = (projectName, blockName) =>
  [projectName, blockName].filter(Boolean).join(', ');

const buildPurchaseOrderSupplierMessage = ({ purchaseOrderId, projectName, blockName }) => {
  const orderLabel = `Заявка на закуп №${purchaseOrderId}`;
  const locationLabel = buildLocationLabel(projectName, blockName);

  return locationLabel
    ? `${orderLabel} (${locationLabel}) ожидает вашей обработки`
    : `${orderLabel} ожидает вашей обработки`;
};

const notifySuppliersAboutPurchaseOrder = async ({
  purchaseOrderId,
  projectId,
  blockId,
  items = []
}) => {
  const supplierIds = [...new Set(
    items
      .map((item) => Number(item?.supplier_id))
      .filter((supplierId) => Number.isFinite(supplierId) && supplierId > 0)
  )];

  if (!supplierIds.length) {
    return;
  }

  const materialIds = [...new Set(
    items
      .map((item) => Number(item?.material_id))
      .filter((materialId) => Number.isFinite(materialId) && materialId > 0)
  )];

  const unitIds = [...new Set(
    items
      .map((item) => Number(item?.unit_of_measure))
      .filter((unitId) => Number.isFinite(unitId) && unitId > 0)
  )];

  const [project, block, suppliers, supplierUsers, materials, units] = await Promise.all([
    projectId
      ? Project.findOne({
          where: { id: projectId, deleted: false },
          attributes: ['id', 'name']
        })
      : null,
    blockId
      ? ProjectBlock.findOne({
          where: { id: blockId, deleted: false },
          attributes: ['id', 'name']
        })
      : null,
    Supplier.findAll({
      where: {
        id: { [Op.in]: supplierIds },
        deleted: false
      },
      attributes: ['id', 'name', 'email']
    }),
    User.findAll({
      where: {
        supplier_id: { [Op.in]: supplierIds },
        deleted: false
      },
      attributes: ['id', 'supplier_id']
    }),
    materialIds.length
      ? Material.findAll({
          where: {
            id: { [Op.in]: materialIds },
            deleted: false
          },
          attributes: ['id', 'name']
        })
      : [],
    unitIds.length
      ? UnitOfMeasure.findAll({
          where: {
            id: { [Op.in]: unitIds },
            deleted: false
          },
          attributes: ['id', 'name']
        })
      : []
  ]);

  const materialMap = new Map(
    materials.map((material) => [Number(material.id), material.name])
  );
  const unitMap = new Map(
    units.map((unit) => [Number(unit.id), unit.name])
  );
  const supplierUsersMap = supplierUsers.reduce((acc, user) => {
    const supplierId = Number(user.supplier_id);
    if (!acc[supplierId]) {
      acc[supplierId] = [];
    }
    acc[supplierId].push(user);
    return acc;
  }, {});

  const title = 'Новая заявка на закуп';
  const message = buildPurchaseOrderSupplierMessage({
    purchaseOrderId,
    projectName: project?.name,
    blockName: block?.name
  });

  await Promise.allSettled(
    suppliers.map(async (supplier) => {
      const supplierId = Number(supplier.id);
      const supplierItems = items
        .filter((item) => Number(item?.supplier_id) === supplierId)
        .map((item) => ({
          material_name: materialMap.get(Number(item.material_id)) || '—',
          quantity: item.quantity,
          unit_name: unitMap.get(Number(item.unit_of_measure)) || ''
        }));

      if (supplier.email) {
        await sendPurchaseOrderSupplierEmail({
          to: supplier.email,
          supplier_name: supplier.name,
          project_name: project?.name,
          block_name: block?.name,
          purchaseOrder: {
            id: purchaseOrderId
          },
          purchaseOrderItems: supplierItems
        });
      }

      const linkedUsers = supplierUsersMap[supplierId] || [];

      if (!linkedUsers.length) {
        return;
      }

      await notifyUsers(
        linkedUsers.map((user) => user.id),
        {
          type: PURCHASE_ORDER_SUPPLIER_NOTIFICATION_TYPE,
          title,
          message,
          entityType: 'purchase_order',
          entityId: purchaseOrderId
        }
      );

      await Promise.allSettled(
        linkedUsers.map((user) =>
          sendPushToUser({
            userId: user.id,
            title,
            body: message,
            data: {
              type: PURCHASE_ORDER_SUPPLIER_NOTIFICATION_TYPE,
              entityType: 'purchase_order',
              purchaseOrderId: String(purchaseOrderId)
            }
          })
        )
      );
    })
  );
};

const getAllPurchaseOrders = async (req, res) => {
  try {
    const whereClause = { deleted: false };
    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where: whereClause,
      distinct: true,
      col: "id",
      order: [['project_id', 'ASC']],
      include: [
        {
          model: PurchaseOrderItem,
          as: 'items',
          required: false,
          where: { deleted: false },
        }
      ]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при заявок на материалы',
      error: error.message
    });
  }
};

const searchPurchaseOrders = async (req, res) => {
  try {
    const {
      project_id,
      block_id,
      created_user_id,
      statuses,
      supplier_id,
      item_statuses,
      search,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;

    const whereClause = { deleted: false };

    if (project_id) whereClause.project_id = project_id;
    if (block_id) whereClause.block_id = block_id;
    if (created_user_id) whereClause.created_user_id = created_user_id;

    /* ============================================================
       СТАТУСЫ PO
    ============================================================ */

    const poStatusFilter = Array.isArray(statuses)
      ? statuses
      : statuses != null
        ? [statuses]
        : null;

    if (poStatusFilter) {
      whereClause.status = { [Op.in]: poStatusFilter };
    }

    /* ============================================================
       СТАТУСЫ ITEMS
    ============================================================ */

    const itemStatusFilter = Array.isArray(item_statuses)
      ? item_statuses
      : item_statuses != null
        ? [item_statuses]
        : null;

    /* ============================================================
       SEARCH (ОР логика)
    ============================================================ */

    const searchValue = search?.trim();

    if (searchValue) {
      const s = `%${searchValue}%`;

      whereClause[Op.or] = [
        Sequelize.where(Sequelize.col('project.name'), {
          [Op.iLike]: s
        }),
        Sequelize.where(Sequelize.col('block.name'), {
          [Op.iLike]: s
        }),
        Sequelize.where(Sequelize.col('items->material.name'), {
          [Op.iLike]: s
        }),
        ...(!isNaN(searchValue)
          ? [
            Sequelize.where(
              Sequelize.cast(Sequelize.col('PurchaseOrder.id'), 'TEXT'),
              {
                [Op.iLike]: `%${searchValue}%`
              }
            )
          ]
          : [])
      ];
    }

    /* ============================================================
       INCLUDE
    ============================================================ */

    const include = [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name'],
        required: false
      },
      {
        model: ProjectBlock,
        as: 'block',
        attributes: ['id', 'name'],
        required: false
      },
      {
        model: PurchaseOrderItem,
        as: 'items',
        required: !!supplier_id || !!itemStatusFilter || !!searchValue,
        where: {
          deleted: false,
          ...(itemStatusFilter && {
            status: { [Op.in]: itemStatusFilter }
          }),
          ...(supplier_id && { supplier_id })
        },
        include: [
          {
            model: Material,
            as: 'material',
            attributes: ['id', 'name'],
            required: false // ❗ важно для OR
          }
        ]
      }
    ];

    /* ============================================================
       QUERY
    ============================================================ */

    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where: whereClause,
      distinct: true,
      subQuery: false, // 🔥 ключевой фикс

      limit: Number(size),
      offset: Number(offset),

      order: [['created_at', 'DESC']],

      include
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: Number(page),
        size: Number(size),
        total: count,
        pages: Math.ceil(count / size),
        hasNext: page * size < count,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Ошибка поиска заявок на материалы:', error);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при поиске заявок на материалы',
      error: error.message
    });
  }
};

const getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const purchaseOrder = await PurchaseOrder.findOne({
      where: {
        id,
        deleted: false
      },
      include: [
        {
          model: PurchaseOrderItem,
          as: 'items',
          required: false
        }
      ]
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Заявка на материалы не найдена'
      });
    }

    res.json({
      success: true,
      data: purchaseOrder
    });

  } catch (error) {
    console.error('Ошибка при получении заявки на закуп:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении заявки на материалы',
      error: error.message
    });
  }
};

const createPurchaseOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const currentUserRoleId = Number(req.user?.role_id);

    if (!PURCHASE_CREATE_ROLE_IDS.includes(currentUserRoleId)) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message:
          '\u0421\u043e\u0437\u0434\u0430\u043d\u0438\u0435 \u0437\u0430\u043a\u0443\u043f\u0430 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e \u0442\u043e\u043b\u044c\u043a\u043e \u0430\u0434\u043c\u0438\u043d\u0443, \u0441\u043d\u0430\u0431\u0436\u0435\u043d\u0446\u0443, \u041f\u0422\u041e \u0438 \u0433\u043b. \u0438\u043d\u0436\u0435\u043d\u0435\u0440\u0443'
      });
    }

    const { items, ...orderData } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Список материалов (items) обязателен'
      });
    }

    /* ============================================================
       1. Создаём заказ на закупку
    ============================================================ */
    const purchaseOrder = await PurchaseOrder.create(
      {
        status: orderData.status ?? 1,
        ...orderData
      },
      { transaction }
    );

    /* ============================================================
       2. Создаём позиции закупки
    ============================================================ */
    const orderItems = items.map(item => ({
      ...item,
      status: item.status ?? 1,
      purchase_order_id: purchaseOrder.id
    }));

    await PurchaseOrderItem.bulkCreate(orderItems, { transaction });

    /* ============================================================
       3. Получаем уникальные material_request_item_id
    ============================================================ */
    const materialRequestItemIds = [
      ...new Set(items.map(i => i.material_request_item_id))
    ];

    /* ============================================================
       4. Получаем MaterialRequestItem (quantity + material_request_id)
    ============================================================ */
    const requestItems = await MaterialRequestItem.findAll({
      where: {
        id: { [Op.in]: materialRequestItemIds }
      },
      attributes: ['id', 'quantity', 'material_request_id'],
      transaction
    });

    /* ============================================================
       5. Считаем, сколько ВСЕГО заказано по каждой позиции
    ============================================================ */
    const orderedTotals = await PurchaseOrderItem.findAll({
      attributes: [
        'material_request_item_id',
        [
          sequelize.fn('SUM', sequelize.col('quantity')),
          'total_ordered'
        ]
      ],
      where: {
        material_request_item_id: { [Op.in]: materialRequestItemIds },
        deleted: false,
        status: { [Op.ne]: 5 } // 5 — отменено
      },
      group: ['material_request_item_id'],
      transaction
    });

    const orderedMap = {};
    orderedTotals.forEach(row => {
      orderedMap[row.material_request_item_id] =
        Number(row.get('total_ordered'));
    });

    /* ============================================================
       6. Обновляем статус КАЖДОЙ MaterialRequestItem
          3 — partially_ordered
          4 — fully_ordered
    ============================================================ */
    for (const item of requestItems) {
      const requested = Number(item.quantity);
      const ordered = orderedMap[item.id] || 0;

      let newStatus = null;

      if (ordered >= requested) {
        newStatus = 4; // полностью заказано
      } else if (ordered > 0) {
        newStatus = 3; // частично заказано
      }

      // обновление статуса
      if (newStatus && item.status !== newStatus) {
        await MaterialRequestItem.update(
          { status: newStatus },
          { where: { id: item.id }, transaction }
        );
      }
    }
    /* ============================================================
      7. Обновляем статус MaterialRequest
    ============================================================ */

    // 7.1 Получаем material_request_id через MaterialRequestItem
    const materialRequestIds = [...new Set(requestItems.map(i => i.material_request_id))];

    // 7.2 Для каждой заявки считаем статусы её позиций
    for (const mrId of materialRequestIds) {
      const mrItems = await MaterialRequestItem.findAll({
        where: {
          material_request_id: mrId,
          deleted: false
        },
        attributes: ['status'],
        transaction
      });

      const allFullyOrdered =
        mrItems.length > 0 &&
        mrItems.every(item => item.status === 4);

      await MaterialRequest.update(
        {
          status: allFullyOrdered ? 4 : 3
        },
        {
          where: { id: mrId },
          transaction
        }
      );
    }

    await transaction.commit();

    try {
      await notifySuppliersAboutPurchaseOrder({
        purchaseOrderId: purchaseOrder.id,
        projectId: orderData.project_id,
        blockId: orderData.block_id,
        items
      });
    } catch (notificationError) {
      console.error('notifySuppliersAboutPurchaseOrder error:', notificationError);
    }

    res.status(201).json({
      success: true,
      message: 'Заявка на материалы успешно создана',
      data: purchaseOrder
    });

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('createPurchaseOrder error:', error);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании заявки на материалы',
      error: error.message
    });
  }
};

const updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, ...data } = req.body;

    const result = await updateWithAudit({
      model: PurchaseOrder,
      id,
      data,
      entityType: 'purchase_order',
      action: 'purchase_order_updated',
      userId: req.user.id,
      comment
    });

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: 'Заявка на закуп не найдена'
      });
    }

    return res.json({
      success: true,
      message: result.changed
        ? 'Заявка на закуп успешно обновлена'
        : 'Изменений не обнаружено',
      data: result.instance
    });

  } catch (error) {
    console.error('updatePurchaseOrder error:', error);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении заявки на закуп',
      error: error.message
    });
  }
};

const deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const materiaId = Number(id);

    // Обновляем поле deleted вместо удаления записи
    const [updated] = await PurchaseOrder.update(
      { deleted: true },
      { where: { id: materiaId } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Заявка на материалы не найдена'
      });
    }

    return res.json({
      success: true,
      message: 'Заявка на материалы успешно удалена'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении заявки на материалы',
      error: error.message
    });
  }
};

module.exports = {
  getAllPurchaseOrders,
  searchPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder
};
