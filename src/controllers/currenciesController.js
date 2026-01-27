const Currency = require('../models/Currency');
const { Op } = require("sequelize");

const getAllCurrencies = async (req, res) => {
  try {
    const whereClause = {deleted: false};

    const { count, rows } = await Currency.findAndCountAll({
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
      message: 'Ошибка сервера при получении валют',
      error: error.message
    });
  }
};

module.exports = {
  getAllCurrencies
};