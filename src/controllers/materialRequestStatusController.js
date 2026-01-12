const MaterialRequestStatus = require('../models/MaterialRequestStatus');
const { Op } = require("sequelize");

const getAllMaterialRequestStatuses = async (req, res) => {
  try {
    const whereClause = {deleted: false};

    const { count, rows } = await MaterialRequestStatus.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
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
      message: 'Ошибка сервера при получении статуса заявки',
      error: error.message
    });
  }
};

const searchMaterialRequestStatuses = async (req, res) => {
  try {
    const {
      name,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;
    const whereClause = {deleted: false};


    if (name)
      whereClause.name = { [Op.iLike]: `%${name}%` };

    const { count, rows } = await MaterialRequestStatus.findAndCountAll({
      where: whereClause,
      limit: Number(size),
      offset: Number(offset),
      order: [['created_at', 'DESC']]
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
    console.error("Ошибка при поиске статусов заявок:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при поиске статусов заявок",
      error: error.message,
    });
  }
};

const getMaterialRequestStatusById = async (req, res) => {
  try {
    const { id } = req.params;
    const materialRequestStatus = await MaterialRequestStatus.findByPk(id);

    if (!materialRequestStatus) {
      return res.status(404).json({
        success: false,
        message: 'Статус заявки не найдена'
      });
    }

    res.json({
      success: true,
      data: materialRequestStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении статуса заявки',
      error: error.message
    });
  }
};

const createMaterialRequestStatus = async (req, res) => {
  try {
    const materialRequestStatus = await MaterialRequestStatus.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Статус заявки успешно создан',
      data: materialRequestStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании статуса заявки',
      error: error.message
    });
  }
};

const updateMaterialRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await MaterialRequestStatus.update(req.body, {
      where: { id: id }
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Статус заявки не найден'
      });
    }

    const updatedProject = await MaterialRequestStatus.findByPk(id);
    
    res.json({
      success: true,
      message: 'Статус заявки успешно обновлен',
      data: updatedProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении статуса заявки',
      error: error.message
    });
  }
};

const deleteMaterialRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const materialRequestStatusId = Number(id);

    // Обновляем поле deleted вместо удаления записи
    const [updated] = await MaterialRequestStatus.update(
      { deleted: true },
      { where: { id: materialRequestStatusId } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Статус заявки не найден'
      });
    }

    res.json({
      success: true,
      message: 'Статус заявки успешно удален'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении статуса заявки',
      error: error.message
    });
  }
};

module.exports = {
  getAllMaterialRequestStatuses,
  searchMaterialRequestStatuses,
  getMaterialRequestStatusById,
  createMaterialRequestStatus,
  updateMaterialRequestStatus,
  deleteMaterialRequestStatus
};