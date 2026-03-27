const { Op } = require("sequelize");
const { MaterialRequest, MaterialRequestItem, PurchaseOrderItem, Material } = require('../models');
const updateWithAudit = require('../utils/updateWithAudit');

const getAllMaterialRequestItems = async (req, res) => {
  try {
    const whereClause = { deleted: false };
    const { count, rows } = await MaterialRequestItem.findAndCountAll({
      where: whereClause,
      order: [['material_request_id', 'ASC']],
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
      message: 'Ошибка сервера при поиске материалов в заявках',
      error: error.message
    });
  }
};


const searchMaterialRequestItems = async (req, res) => {
  try {
    const {
      material_type,
      material_id,
      project_id,
      block_id,
      search,
      statuses,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;

    const whereClause = { deleted: false };

    if (material_type) whereClause.material_type = material_type;
    if (material_id) whereClause.material_id = material_id;

    const statusFilter = Array.isArray(statuses)
      ? statuses
      : statuses != null
        ? [statuses]
        : null;

    /* ============================================================
       INCLUDE
    ============================================================ */

    const include = [
      {
        model: MaterialRequest,
        as: 'material_request',
        where: {
          deleted: false,

          ...(statusFilter && {
            status: {
              [Op.in]: statusFilter
            }
          }),

          ...(project_id && { project_id }),
          ...(block_id && { block_id })
        },
        attributes: []
      }
    ];

    /* ============================================================
       ПОИСК ПО MATERIAL (name + id)
    ============================================================ */

    if (search && search.trim() !== "") {
      const s = `%${search.trim()}%`;

      include.push({
        model: Material,
        as: 'material',
        required: true,
        where: {
          [Op.or]: [
            { name: { [Op.iLike]: s } },
            !isNaN(search) ? { id: Number(search) } : null
          ].filter(Boolean)
        },
        attributes: ['id', 'name']
      });
    } else {
      // если поиска нет — просто подтягиваем material
      include.push({
        model: Material,
        as: 'material',
        attributes: ['id', 'name']
      });
    }

    /* ============================================================
       ОСНОВНОЙ ЗАПРОС
    ============================================================ */

    const { count, rows } = await MaterialRequestItem.findAndCountAll({
      distinct: true,
      where: whereClause,
      include,
      limit: Number(size),
      offset: Number(offset),
      order: [['status', 'ASC']]
    });

    /* ============================================================
       СЧИТАЕМ ЗАКАЗАННОЕ
    ============================================================ */

    const requestItemIds = rows.map(item => item.id);

    const orderedQuantities = await PurchaseOrderItem.findAll({
      attributes: [
        'material_request_item_id',
        [
          PurchaseOrderItem.sequelize.fn(
            'SUM',
            PurchaseOrderItem.sequelize.col('quantity')
          ),
          'total_ordered'
        ]
      ],
      where: {
        material_request_item_id: { [Op.in]: requestItemIds },
        deleted: false
      },
      group: ['material_request_item_id']
    });

    const orderedMap = {};

    orderedQuantities.forEach(o => {
      orderedMap[o.material_request_item_id] = Number(
        o.get('total_ordered')
      );
    });

    /* ============================================================
       ФОРМИРУЕМ ОТВЕТ
    ============================================================ */

    const dataWithOrders = rows.map(item => {
      const totalOrdered = orderedMap[item.id] || 0;
      const remainingQuantity = Math.max(item.quantity - totalOrdered, 0);

      return {
        ...item.toJSON(),
        total_ordered: totalOrdered,
        remaining_quantity: remainingQuantity
      };
    });

    /* ============================================================
       RESPONSE
    ============================================================ */

    res.json({
      success: true,
      data: dataWithOrders,
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

    console.error(
      'Ошибка сервера при поиске материалов для снабженца:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при поиске материалов для снабженца',
      error: error.message
    });

  }
};

const getMaterialRequestItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const materialRequestItem = await MaterialRequestItem.findByPk(id);

    if (!materialRequestItem) {
      return res.status(404).json({
        success: false,
        message: 'Материал в заявке не найден'
      });
    }

    res.json({
      success: true,
      data: materialRequestItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении материал в заявке',
      error: error.message
    });
  }
};

const createMaterialRequestItem = async (req, res) => {
  try {
    const materialRequestItem = await MaterialRequestItem.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Материал успешно добавлен в заявку',
      data: materialRequestItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при добавлении материала в заявку',
      error: error.message
    });
  }
};

const updateMaterialRequestItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, ...data } = req.body;

    const result = await updateWithAudit({
      model: MaterialRequestItem,
      id,
      data,
      entityType: 'material_request_item',
      action: 'material_request_item_updated',
      userId: req.user.id,
      comment
    });

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: 'Материал в заявке не найден'
      });
    }

    return res.json({
      success: true,
      message: result.changed
        ? 'Материал в заявке успешно обновлён'
        : 'Изменений не обнаружено',
      data: result.instance
    });

  } catch (error) {
    console.error('updateMaterialRequestItem error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении материала в заявке',
      error: error.message
    });
  }
};

const deleteMaterialRequestItem = async (req, res) => {
  try {
    const { id } = req.params;
    const materiaId = Number(id);

    // Обновляем поле deleted вместо удаления записи
    const [updated] = await MaterialRequestItem.update(
      { deleted: true },
      { where: { id: materiaId } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Материал в заявке не найден'
      });
    }

    return res.json({
      success: true,
      message: 'Материал успешно удален из заявки'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении материала из заявки',
      error: error.message
    });
  }
};

module.exports = {
  getAllMaterialRequestItems,
  searchMaterialRequestItems,
  getMaterialRequestItemById,
  createMaterialRequestItem,
  updateMaterialRequestItem,
  deleteMaterialRequestItem
};