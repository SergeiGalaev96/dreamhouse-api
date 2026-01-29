const { Op } = require('sequelize');
const {
  sequelize,
  MaterialStatement,
  MaterialStatementItem
} = require('../models');

const updateWithAudit = require('../utils/updateWithAudit');

const getAllMaterialStatements = async (req, res) => {
  try {
    const whereClause = { deleted: false };

    const { count, rows } = await MaterialStatement.findAndCountAll({
      where: whereClause,
      distinct: true,
      col: 'id',
      order: [['project_id', 'ASC']],
      include: [
        {
          model: MaterialStatementItem,
          as: 'items',
          required: false,
          where: { deleted: false }
        }
      ]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении ведомостей',
      error: error.message
    });
  }
};

const searchMaterialStatements = async (req, res) => {
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

    const { count, rows } = await MaterialStatement.findAndCountAll({
      where: whereClause,
      distinct: true,
      col: 'id',
      limit: Number(size),
      offset: Number(offset),
      order: [['created_at', 'DESC']],
      include: [
        {
          model: MaterialStatementItem,
          as: 'items',
          required: false
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
    console.error('Ошибка поиска ведомостей:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при поиске ведомостей',
      error: error.message
    });
  }
};

const getMaterialStatementById = async (req, res) => {
  try {
    const { id } = req.params;

    const statement = await MaterialStatement.findOne({
      where: { id, deleted: false },
      include: [
        {
          model: MaterialStatementItem,
          as: 'items'
        }
      ]
    });

    if (!statement) {
      return res.status(404).json({
        success: false,
        message: 'Ведомость не найдена'
      });
    }

    res.json({
      success: true,
      data: statement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении ведомости',
      error: error.message
    });
  }
};

const createMaterialStatement = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { items, ...statementData } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Список материалов (items) обязателен'
      });
    }

    const statement = await MaterialStatement.create(
      {
        ...statementData,
        created_user_id: req.user.id
      },
      { transaction }
    );

    const preparedItems = items.map(item => ({
      ...item,
      material_statement_id: statement.id
    }));

    await MaterialStatementItem.bulkCreate(
      preparedItems,
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Ведомость материалов успешно создана',
      data: statement
    });

  } catch (error) {
    await transaction.rollback();
    console.error('createMaterialStatement error:', error);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании ведомости',
      error: error.message
    });
  }
};

const updateMaterialStatement = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { comment, ...data } = req.body;

    const result = await updateWithAudit({
      model: MaterialStatement,
      id,
      data,
      entityType: 'material_statement',
      action: 'material_statement_updated',
      userId: req.user.id,
      comment,
      transaction
    });

    if (result.notFound) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Ведомость не найдена'
      });
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Ведомость успешно обновлена',
      data: result.instance
    });

  } catch (error) {
    await transaction.rollback();
    console.error('updateMaterialStatement error:', error);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении ведомости',
      error: error.message
    });
  }
};

const deleteMaterialStatement = async (req, res) => {
  try {
    const { id } = req.params;

    const [updated] = await MaterialStatement.update(
      { deleted: true },
      { where: { id } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Ведомость не найдена'
      });
    }

    res.json({
      success: true,
      message: 'Ведомость успешно удалена'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении ведомости',
      error: error.message
    });
  }
};

module.exports = {
  getAllMaterialStatements,
  searchMaterialStatements,
  getMaterialStatementById,
  createMaterialStatement,
  updateMaterialStatement,
  deleteMaterialStatement
};
