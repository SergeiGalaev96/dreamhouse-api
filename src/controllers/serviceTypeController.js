const { Op } = require('sequelize');
const sequelize = require('../config/database');
const ServiceType = require('../models/ServiceType');
const updateWithAudit = require('../utils/updateWithAudit');

/* ===================== GET ALL ===================== */
const getAllServiceTypes = async (req, res) => {
  try {
    const data = await ServiceType.findAll({
      where: { deleted: false },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении типов услуг',
      error: error.message
    });
  }
};


/* ===================== SEARCH ===================== */
const searchServiceTypes = async (req, res) => {
  try {
    const { search, page = 1, size = 10 } = req.body;

    const offset = (page - 1) * size;

    const whereClause = { deleted: false };

    if (search) {
      whereClause.name = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await ServiceType.findAndCountAll({
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
        pages: Math.ceil(count / size)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка поиска типов услуг',
      error: error.message
    });
  }
};


/* ===================== GET BY ID ===================== */
const getServiceTypeById = async (req, res) => {
  try {
    const item = await ServiceType.findOne({
      where: { id: req.params.id, deleted: false }
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Тип услуги не найден'
      });
    }

    res.json({ success: true, data: item });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения типа услуги',
      error: error.message
    });
  }
};


/* ===================== CREATE ===================== */
const createServiceType = async (req, res) => {
  try {
    const item = await ServiceType.create({
      ...req.body,
      deleted: false
    });

    res.status(201).json({
      success: true,
      message: 'Тип услуги создан',
      data: item
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка создания типа услуги',
      error: error.message
    });
  }
};


/* ===================== UPDATE ===================== */
const updateServiceType = async (req, res) => {
  try {

    const result = await updateWithAudit({
      model: ServiceType,
      id: req.params.id,
      data: req.body,
      entityType: 'service_type',
      action: 'service_type_updated',
      userId: req.user.id
    });

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: 'Тип услуги не найден'
      });
    }

    res.json({
      success: true,
      message: 'Тип услуги обновлён',
      data: result.instance
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления',
      error: error.message
    });
  }
};


/* ===================== DELETE ===================== */
const deleteServiceType = async (req, res) => {
  try {
    const [updated] = await ServiceType.update(
      { deleted: true },
      { where: { id: req.params.id } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Тип услуги не найден'
      });
    }

    res.json({
      success: true,
      message: 'Тип услуги удалён'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления',
      error: error.message
    });
  }
};


module.exports = {
  getAllServiceTypes,
  searchServiceTypes,
  getServiceTypeById,
  createServiceType,
  updateServiceType,
  deleteServiceType
};
