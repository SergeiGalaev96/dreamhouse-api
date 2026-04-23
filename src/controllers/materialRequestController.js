const { Op, Sequelize } = require("sequelize");
const {
  sequelize,
  MaterialRequest,
  MaterialRequestItem,
  Material,
  UnitOfMeasure
} = require('../models');
const User = require('../models/User');
const Project = require("../models/Project");
const { sendMaterialRequestEmail } = require('../utils/mailer');
const updateWithAudit = require('../utils/updateWithAudit');

const getAllMaterialRequests = async (req, res) => {
  try {
    const whereClause = { deleted: false };
    const { count, rows } = await MaterialRequest.findAndCountAll({
      where: whereClause,
      distinct: true,
      col: "id",
      order: [['project_id', 'ASC']],
      include: [
        {
          model: MaterialRequestItem,
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

const searchMaterialRequests = async (req, res) => {
  try {
    const {
      project_id,
      block_id,
      statuses,
      item_statuses, // 👈 добавили
      search,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;

    const whereClause = { deleted: false };

    if (project_id) whereClause.project_id = project_id;
    if (block_id) whereClause.block_id = block_id;

    /* ============================================================
       СТАТУСЫ MaterialRequest
    ============================================================ */

    const statusFilter = Array.isArray(statuses)
      ? statuses
      : statuses != null
        ? [statuses]
        : null;

    if (statusFilter) {
      whereClause.status = {
        [Op.in]: statusFilter
      };
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
       SEARCH
    ============================================================ */

    const searchValue = search?.trim();

    if (searchValue) {
      const s = `%${searchValue}%`;

      whereClause[Op.or] = [
        // поиск по id (частичный)
        Sequelize.where(
          Sequelize.cast(Sequelize.col('MaterialRequest.id'), 'TEXT'),
          { [Op.iLike]: s }
        ),

        // поиск по материалу
        Sequelize.where(
          Sequelize.col('items->material.name'),
          { [Op.iLike]: s }
        )
      ];
    }

    /* ============================================================
       INCLUDE
    ============================================================ */

    const include = [
      {
        model: MaterialRequestItem,
        as: 'items',
        required: !!searchValue || !!itemStatusFilter, // 🔥 важно
        where: {
          deleted: false,
          ...(itemStatusFilter && {
            status: { [Op.in]: itemStatusFilter }
          })
        },
        include: [
          {
            model: Material,
            as: 'material',
            attributes: ['id', 'name'],
            required: false
          }
        ]
      }
    ];

    /* ============================================================
       QUERY
    ============================================================ */

    const { count, rows } = await MaterialRequest.findAndCountAll({
      where: whereClause,
      distinct: true,
      subQuery: false,

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

const getMaterialRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const materialRequest = await MaterialRequest.findOne({
      where: {
        id,
        deleted: false
      },
      include: [
        {
          model: MaterialRequestItem,
          as: 'items',
          required: false
        }
      ]
    });

    if (!materialRequest) {
      return res.status(404).json({
        success: false,
        message: 'Заявка на материалы не найдена'
      });
    }

    res.json({
      success: true,
      data: materialRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении заявки на материалы',
      error: error.message
    });
  }
};

const createMaterialRequest = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { items, ...requestData } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Список материалов (items) обязателен'
      });
    }

    // 1. Создаём заявку
    const materialRequest = await MaterialRequest.create(
      requestData,
      { transaction }
    );

    // 2. Формируем items с привязкой к заявке
    const requestItems = items.map(item => ({
      ...item,
      material_request_id: materialRequest.id
    }));

    // 3. Массово создаём позиции
    await MaterialRequestItem.bulkCreate(
      requestItems,
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Заявка на материалы успешно создана',
      data: materialRequest
    });

  } catch (error) {
    await transaction.rollback();
    console.error('createMaterialRequest error:', error);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании заявки на материалы',
      error: error.message
    });
  }
};

const updateMaterialRequest = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {

    const { id } = req.params;

    const {
      approved_by_foreman,
      approved_by_site_manager,
      approved_by_purchasing_agent,
      approved_by_planning_engineer,
      approved_by_main_engineer,
      comment,
      ...restBody
    } = req.body;

    /* ============================================================
       Проверяем наличие заявки
    ============================================================ */

    const materialRequest = await MaterialRequest.findByPk(id, { transaction });

    if (!materialRequest) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: 'Заявка на материалы не найдена'
      });
    }

    /* ============================================================
       Итоговые значения согласований (body имеет приоритет)
    ============================================================ */

    const finalApprovals = {

      approved_by_foreman:
        approved_by_foreman ?? materialRequest.approved_by_foreman,

      approved_by_site_manager:
        approved_by_site_manager ?? materialRequest.approved_by_site_manager,

      approved_by_purchasing_agent:
        approved_by_purchasing_agent ?? materialRequest.approved_by_purchasing_agent,

      approved_by_planning_engineer:
        approved_by_planning_engineer ?? materialRequest.approved_by_planning_engineer,

      approved_by_main_engineer:
        approved_by_main_engineer ?? materialRequest.approved_by_main_engineer
    };

    /* ============================================================
       Проверяем, все ли согласовали
    ============================================================ */

    const isFullyApproved =
      finalApprovals.approved_by_foreman === true &&
      finalApprovals.approved_by_site_manager === true &&
      finalApprovals.approved_by_purchasing_agent === true &&
      finalApprovals.approved_by_planning_engineer === true &&
      finalApprovals.approved_by_main_engineer === true;

    /* ============================================================
       Автоматическое время подписи
    ============================================================ */

    const now = new Date();

    const approvalTimes = {

      ...(approved_by_foreman === true &&
        !materialRequest.approved_by_foreman_time
        ? { approved_by_foreman_time: now }
        : {}),

      ...(approved_by_site_manager === true &&
        !materialRequest.approved_by_site_manager_time
        ? { approved_by_site_manager_time: now }
        : {}),

      ...(approved_by_purchasing_agent === true &&
        !materialRequest.approved_by_purchasing_agent_time
        ? { approved_by_purchasing_agent_time: now }
        : {}),

      ...(approved_by_planning_engineer === true &&
        !materialRequest.approved_by_planning_engineer_time
        ? { approved_by_planning_engineer_time: now }
        : {}),

      ...(approved_by_main_engineer === true &&
        !materialRequest.approved_by_main_engineer_time
        ? { approved_by_main_engineer_time: now }
        : {})

    };

    /* ============================================================
       Апдейт заявки + АУДИТ
    ============================================================ */

    const result = await updateWithAudit({
      model: MaterialRequest,
      id,
      data: {
        ...restBody,
        ...finalApprovals,
        ...approvalTimes,
        ...(isFullyApproved ? { status: 2 } : {})
      },
      entityType: 'material_request',
      action: 'material_request_updated',
      userId: req.user.id,
      comment,
      transaction
    });

    if (result.notFound) {

      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: 'Заявка на материалы не найдена'
      });

    }

    /* ============================================================
       Если полностью одобрена — обновляем позиции
    ============================================================ */

    if (isFullyApproved) {

      await MaterialRequestItem.update(
        { status: 2 },
        {
          where: { material_request_id: id },
          transaction
        }
      );

      /* ============================================================
         Уведомления снабженцам
      ============================================================ */

      const purchaseAgents = await User.findAll({
        where: {
          deleted: false,
          role_id: 7,
          email: { [Op.ne]: null }
        },
        attributes: ['id', 'email', 'first_name', 'last_name'],
        transaction
      });

      const project = await Project.findOne({
        where: {
          deleted: false,
          id: materialRequest.project_id
        },
        attributes: ['id', 'name'],
        transaction
      });

      const materialRequestItems = await MaterialRequestItem.findAll({
        where: {
          material_request_id: materialRequest.id,
          deleted: false
        },
        include: [
          {
            model: Material,
            as: 'material',
            attributes: ['name']
          },
          {
            model: UnitOfMeasure,
            as: 'unit',
            attributes: ['name']
          }
        ],
        attributes: ['quantity', 'comment'],
        transaction
      });

      const preparedItems = materialRequestItems.map(i => ({
        material_name: i.material?.name,
        quantity: i.quantity,
        unit_of_measure_name: i.unit?.name,
        comment: i.comment
      }));

      for (const user of purchaseAgents) {

        await sendMaterialRequestEmail({
          to: user.email,
          project_name: project.name,
          materialRequest,
          materialRequestItems: preparedItems
        });

      }

    }

    await transaction.commit();

    return res.json({
      success: true,
      message: 'Заявка на материалы успешно обновлена',
      data: result.instance
    });

  } catch (error) {

    await transaction.rollback();

    console.error('updateMaterialRequest error:', error);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении заявки на материалы',
      error: error.message
    });

  }
};

const deleteMaterialRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const materiaId = Number(id);

    // Обновляем поле deleted вместо удаления записи
    const [updated] = await MaterialRequest.update(
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
  getAllMaterialRequests,
  searchMaterialRequests,
  getMaterialRequestById,
  createMaterialRequest,
  updateMaterialRequest,
  deleteMaterialRequest
};
