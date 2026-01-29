const DocumentStage = require('../models/DocumentStage');
const { Op } = require("sequelize");

const getAllDocumentStages = async (req, res) => {
  try {
    const whereClause = {deleted: false};

    const { count, rows } = await DocumentStage.findAndCountAll({
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
      message: 'Ошибка сервера при получении этапов Юр отдела',
      error: error.message
    });
  }
};

module.exports = {
  getAllDocumentStages,
};