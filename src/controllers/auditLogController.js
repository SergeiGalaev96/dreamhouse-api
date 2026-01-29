const { Op } = require('sequelize');
const AuditLog = require('../models/AuditLog');

const getAuditHistory = async (req, res) => {
  try {
    const {
      entity_type,
      entity_id,
      action,
      page = 1,
      size = 20
    } = req.query;

    if (!entity_type || !entity_id) {
      return res.status(400).json({
        success: false,
        message: 'entity_type и entity_id обязательны'
      });
    }

    const limit = Number(size);
    const offset = (Number(page) - 1) * limit;

    const where = {
      entity_type,
      entity_id: Number(entity_id)
    };

    if (action) {
      where.action = action;
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: Number(page),
        size: limit,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении истории',
      error: error.message
    });
  }
};

module.exports = {
  getAuditHistory
};
