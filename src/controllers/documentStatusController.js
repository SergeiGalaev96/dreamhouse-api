const DocumentStatus = require('../models/DocumentStatus');
const { Op } = require("sequelize");

const getAllDocumentStatuses = async (req, res) => {
  try {
    const whereClause = {deleted: false};

    const { count, rows } = await DocumentStatus.findAndCountAll({
      where: whereClause,
      order: [['id', 'ASC']]
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
      message: 'Ошибка сервера при получении статусов документа',
      error: error.message
    });
  }
};

module.exports = {
  getAllDocumentStatuses,
};