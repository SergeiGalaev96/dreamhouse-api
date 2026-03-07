const { Sequelize } = require("sequelize");
const { Op } = require("sequelize");
const SupplierRating = require('../models/SupplierRating');
const updateWithAudit = require('../utils/updateWithAudit');

const getSupplierRatingSummary = async (req, res) => {
  try {

    const { supplier_id } = req.params;

    const result = await SupplierRating.findOne({

      attributes: [

        [
          Sequelize.fn('COUNT', Sequelize.col('id')),
          'ratings_count'
        ],

        [
          Sequelize.literal(`ROUND(COALESCE(AVG(quality),0)::numeric,2)::float`),
          'avg_quality'
        ],

        [
          Sequelize.literal(`ROUND(COALESCE(AVG(time),0)::numeric,2)::float`),
          'avg_time'
        ],

        [
          Sequelize.literal(`ROUND(COALESCE(AVG(price),0)::numeric,2)::float`),
          'avg_price'
        ],

        [
          Sequelize.literal(`
            ROUND(
              (
                COALESCE(AVG(quality),0) +
                COALESCE(AVG(time),0) +
                COALESCE(AVG(price),0)
              ) / 3
            ,2)::float
          `),
          'avg_total_rating'
        ]

      ],

      where: {
        supplier_id,
        deleted: false
      },

      raw: true
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {

    console.error("Ошибка получения рейтинга поставщика:", error);

    res.status(500).json({
      success: false,
      message: "Ошибка сервера при получении рейтинга поставщика",
      error: error.message
    });

  }
};

const getAllSupplierRatings = async (req, res) => {
  try {

    const whereClause = { deleted: false };

    const { count, rows } = await SupplierRating.findAndCountAll({
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
      message: 'Ошибка сервера при получении рейтингов поставщиков',
      error: error.message
    });

  }
};

const searchSupplierRatings = async (req, res) => {
  try {

    const {
      supplier_id,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;

    const whereClause = { deleted: false };

    if (supplier_id)
      whereClause.supplier_id = supplier_id;

    const { count, rows } = await SupplierRating.findAndCountAll({
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

    console.error("Ошибка при поиске рейтингов поставщиков:", error);

    res.status(500).json({
      success: false,
      message: "Ошибка сервера при поиске рейтингов поставщиков",
      error: error.message
    });

  }
};

const getSupplierRatingById = async (req, res) => {
  try {

    const { id } = req.params;

    const rating = await SupplierRating.findByPk(id);

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Рейтинг поставщика не найден'
      });
    }

    res.json({
      success: true,
      data: rating
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении рейтинга поставщика',
      error: error.message
    });

  }
};

const createSupplierRating = async (req, res) => {
  try {

    const rating = await SupplierRating.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Рейтинг поставщика успешно создан',
      data: rating
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании рейтинга поставщика',
      error: error.message
    });

  }
};

const updateSupplierRating = async (req, res) => {
  try {

    const { id } = req.params;
    const { comment, ...data } = req.body;

    const result = await updateWithAudit({
      model: SupplierRating,
      id,
      data,
      entityType: 'supplier_rating',
      action: 'supplier_rating_updated',
      userId: req.user.id,
      comment
    });

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: 'Рейтинг поставщика не найден'
      });
    }

    return res.json({
      success: true,
      message: result.changed
        ? 'Рейтинг поставщика успешно обновлён'
        : 'Изменений не обнаружено',
      data: result.instance
    });

  } catch (error) {

    console.error('updateSupplierRating error:', error);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении рейтинга поставщика',
      error: error.message
    });

  }
};

const deleteSupplierRating = async (req, res) => {
  try {

    const { id } = req.params;

    const [updated] = await SupplierRating.update(
      { deleted: true },
      { where: { id } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Рейтинг поставщика не найден'
      });
    }

    res.json({
      success: true,
      message: 'Рейтинг поставщика успешно удалён'
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении рейтинга поставщика',
      error: error.message
    });

  }
};

module.exports = {
  getSupplierRatingSummary,
  getAllSupplierRatings,
  searchSupplierRatings,
  getSupplierRatingById,
  createSupplierRating,
  updateSupplierRating,
  deleteSupplierRating
};