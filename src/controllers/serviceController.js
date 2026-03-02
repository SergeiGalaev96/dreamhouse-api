const { Op } = require('sequelize');
const Service = require('../models/Service');
const updateWithAudit = require('../utils/updateWithAudit');


const getAllServices = async (req, res) => {
  try {
    const data = await Service.findAll({
      where: { deleted: false },
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения услуг',
      error: error.message
    });
  }
};


const searchServices = async (req, res) => {
  try {
    const { search, service_type, page = 1, size = 10 } = req.body;
    const offset = (page - 1) * size;

    const whereClause = { deleted: false };

    if (search)
      whereClause.name = { [Op.iLike]: `%${search}%` };

    if (service_type)
      whereClause.service_type = service_type;

    const { count, rows } = await Service.findAndCountAll({
      where: whereClause,
      limit: Number(size),
      offset: Number(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        size,
        total: count,
        pages: Math.ceil(count / size)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка поиска услуг',
      error: error.message
    });
  }
};


const getServiceById = async (req, res) => {
  try {
    const item = await Service.findOne({
      where: { id: req.params.id, deleted: false }
    });

    if (!item)
      return res.status(404).json({ success: false, message: 'Услуга не найдена' });

    res.json({ success: true, data: item });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения услуги',
      error: error.message
    });
  }
};


const createService = async (req, res) => {
  try {
    const item = await Service.create({
      ...req.body,
      deleted: false
    });

    res.status(201).json({
      success: true,
      message: 'Услуга создана',
      data: item
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка создания услуги',
      error: error.message
    });
  }
};


const updateService = async (req, res) => {
  try {
    const result = await updateWithAudit({
      model: Service,
      id: req.params.id,
      data: req.body,
      entityType: 'service',
      action: 'service_updated',
      userId: req.user.id
    });

    if (result.notFound)
      return res.status(404).json({ success: false, message: 'Услуга не найдена' });

    res.json({
      success: true,
      message: 'Услуга обновлена',
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


const deleteService = async (req, res) => {
  try {
    const [updated] = await Service.update(
      { deleted: true },
      { where: { id: req.params.id } }
    );

    if (!updated)
      return res.status(404).json({ success: false, message: 'Услуга не найдена' });

    res.json({ success: true, message: 'Услуга удалена' });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления',
      error: error.message
    });
  }
};


module.exports = {
  getAllServices,
  searchServices,
  getServiceById,
  createService,
  updateService,
  deleteService
};
