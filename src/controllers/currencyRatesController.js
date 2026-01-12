const CurrencyRate = require('../models/CurrencyRate');
const { Op } = require("sequelize");

const getAllCurrencyRates = async (req, res) => {
  try {
    const whereClause = {deleted: false};

    const { count, rows } = await CurrencyRate.findAndCountAll({
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
      message: 'Ошибка сервера при получении курсов валют',
      error: error.message
    });
  }
};

const getCurrencyRatesByDate = async (req, res) => {
  try{
    const { date } = req.params;
    const whereClause = {deleted: false, date: date};

    const { count, rows } = await CurrencyRate.findAndCountAll({
      where: whereClause,
      order: [["created_at", "DESC"]],
    });

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении курсов валют',
      error: error.message
    });
  }
}

module.exports = {
  getAllCurrencyRates,
  getCurrencyRatesByDate
};