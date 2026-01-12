const { Op } = require("sequelize");
const sequelize = require('../config/database');
const MaterialRequest = require('../models/MaterialRequest');
const MaterialRequestItem = require('../models/MaterialRequestItem');

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
      status,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;

    const whereClause = { deleted: false };

    if (project_id) whereClause.project_id = project_id;
    if (status) whereClause.status = status;

    const { count, rows } = await MaterialRequest.findAndCountAll({
      where: whereClause,
      distinct: true,
      col: "id",
      limit: Number(size),
      offset: Number(offset),
      order: [['created_at', 'DESC']],

      include: [
        {
          model: MaterialRequestItem,
          as: 'items',
          required: false,          // НЕ INNER JOIN → заявка может быть без items
          where: { deleted: false },
        }
      ]
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

// const createMaterialRequest = async (req, res) => {
//   try {
//     const materialRequest = await MaterialRequest.create(req.body);

//     res.status(201).json({
//       success: true,
//       message: 'Заявка на материалы успешно создана',
//       data: materialRequest
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Ошибка сервера при создании заявки на материалы',
//       error: error.message
//     });
//   }
// };

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
      ...restBody
    } = req.body;

    const materialRequest = await MaterialRequest.findByPk(id, { transaction });

    if (!materialRequest) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Заявка на материалы не найдена'
      });
    }

    /* ============================================================
       Проверяем, все ли согласовали
    ============================================================ */
    const isFullyApproved =
      approved_by_foreman === true &&
      approved_by_site_manager === true &&
      approved_by_purchasing_agent === true &&
      approved_by_planning_engineer === true &&
      approved_by_main_engineer === true;

    /* ============================================================
       Обновляем заявку (один раз)
    ============================================================ */
    await materialRequest.update(
      {
        ...restBody,
        approved_by_foreman,
        approved_by_site_manager,
        approved_by_purchasing_agent,
        approved_by_planning_engineer,
        approved_by_main_engineer,
        ...(isFullyApproved ? { status: 2 } : {})
      },
      { transaction }
    );

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
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Заявка на материалы успешно обновлена',
      data: materialRequest
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