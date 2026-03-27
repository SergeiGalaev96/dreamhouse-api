const { Supplier, SupplierRating } = require('../models');
const { Op, Sequelize } = require("sequelize");
const updateWithAudit = require('../utils/updateWithAudit');

const getAllSuppliers = async (req, res) => {
  try {

    const whereClause = { deleted: false };

    const { count, rows } = await Supplier.findAndCountAll({

      where: whereClause,

      order: [["created_at", "DESC"]],

      attributes: {
        include: [

          [
            Sequelize.literal(`ROUND(AVG(ratings.quality)::numeric,2)::float`),
            "avg_quality"
          ],

          [
            Sequelize.literal(`ROUND(AVG(ratings.time)::numeric,2)::float`),
            "avg_time"
          ],

          [
            Sequelize.literal(`ROUND(AVG(ratings.price)::numeric,2)::float`),
            "avg_price"
          ],

          [
            Sequelize.literal(`
              ROUND(
                (
                  COALESCE(AVG(ratings.quality),0) +
                  COALESCE(AVG(ratings.time),0) +
                  COALESCE(AVG(ratings.price),0)
                ) / 3
              ,2)::float
            `),
            "avg_rating"
          ],

          [
            Sequelize.literal(`COUNT(ratings.id)`),
            "ratings_count"
          ]

        ]
      },

      include: [
        {
          model: SupplierRating,
          as: "ratings",     // ← ОБЯЗАТЕЛЬНО
          attributes: [],
          required: false
        }
      ],

      group: ["Supplier.id"]

    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: Array.isArray(count) ? count.length : count
      }
    });

  } catch (error) {

    console.error("Ошибка получения поставщиков:", error);

    res.status(500).json({
      success: false,
      message: "Ошибка сервера при получении поставщиков",
      error: error.message
    });

  }
};

const recommendSuppliers = async (req, res) => {
  try {

    const { material_id, currency } = req.params;

    if (!material_id) {
      return res.status(400).json({
        success: false,
        message: "material_id обязателен"
      });
    }

    if (!currency) {
      return res.status(400).json({
        success: false,
        message: "currency header обязателен"
      });
    }

    const materialId = Number(material_id);

    const suppliers = await Supplier.findAll({
      where: {
        deleted: false
      },

      subQuery: false,

      attributes: {
        include: [

          /* ============================================================
             ЛУЧШАЯ ЦЕНА В НУЖНОЙ ВАЛЮТЕ
          ============================================================ */
          [
            Sequelize.literal(`
              (
                SELECT MIN(
                  CASE
                    WHEN poi.currency = '${currency}'
                      THEN poi.price
                    ELSE poi.price * COALESCE(poi.currency_rate, 1)
                  END
                )
                FROM construction.purchase_order_items poi
                WHERE poi.supplier_id = "Supplier".id
                AND poi.material_id = ${materialId}
                AND poi.status = 4
              )
            `),
            "best_price"
          ],

          /* ============================================================
             РЕЙТИНГ
          ============================================================ */
          [
            Sequelize.literal(`
              ROUND(
                (
                  COALESCE(AVG(ratings.quality),0) +
                  COALESCE(AVG(ratings.time),0) +
                  COALESCE(AVG(ratings.price),0)
                ) / 3
              ,2)::float
            `),
            "avg_rating"
          ],

          [
            Sequelize.literal(`COUNT(ratings.id)`),
            "ratings_count"
          ]

        ]
      },

      include: [
        {
          model: SupplierRating,
          as: "ratings",
          attributes: [],
          required: false
        }
      ],

      group: ["Supplier.id"],

      order: [
        [Sequelize.literal('"best_price"'), 'ASC NULLS LAST'],
        [Sequelize.literal('"avg_rating"'), 'DESC']
      ]

    });

    res.json({
      success: true,
      data: suppliers
    });

  } catch (error) {

    console.error("Ошибка получения поставщиков:", error);

    res.status(500).json({
      success: false,
      message: "Ошибка сервера",
      error: error.message
    });

  }
};

const searchSuppliers = async (req, res) => {
  try {

    const { search, page = 1, size = 10 } = req.body;

    const limit = Number(size);
    const offset = (Number(page) - 1) * limit;

    const whereClause = { deleted: false };

    if (search && search.trim() !== "") {
      const s = `%${search.trim()}%`;

      whereClause[Op.or] = [
        { name: { [Op.iLike]: s } },
        { address: { [Op.iLike]: s } },
        { phone: { [Op.iLike]: s } },
        { email: { [Op.iLike]: s } },
        { inn: { [Op.iLike]: s } },
        { kpp: { [Op.iLike]: s } },
        { ogrn: { [Op.iLike]: s } }
      ];
    }

    const { count, rows } = await Supplier.findAndCountAll({

      where: whereClause,

      limit,
      offset,

      subQuery: false,   // ← ВАЖНО

      order: [["created_at", "DESC"]],

      attributes: {
        include: [

          [
            Sequelize.literal(`ROUND(AVG(ratings.quality)::numeric,2)::float`),
            "avg_quality"
          ],

          [
            Sequelize.literal(`ROUND(AVG(ratings.time)::numeric,2)::float`),
            "avg_time"
          ],

          [
            Sequelize.literal(`ROUND(AVG(ratings.price)::numeric,2)::float`),
            "avg_price"
          ],

          [
            Sequelize.literal(`
              ROUND(
                (
                  COALESCE(AVG(ratings.quality),0) +
                  COALESCE(AVG(ratings.time),0) +
                  COALESCE(AVG(ratings.price),0)
                ) / 3
              ,2)::float
            `),
            "avg_rating"
          ],

          [
            Sequelize.literal(`COUNT(ratings.id)`),
            "ratings_count"
          ]

        ]
      },

      include: [
        {
          model: SupplierRating,
          as: "ratings",     // обязательно
          attributes: [],
          required: false
        }
      ],

      group: ["Supplier.id"]

    });

    const total = Array.isArray(count) ? count.length : count;

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: Number(page),
        size: limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {

    console.error("Ошибка при поиске поставщиков:", error);

    res.status(500).json({
      success: false,
      message: "Ошибка сервера при поиске поставщиков",
      error: error.message
    });

  }
};

const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findByPk(id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Поставщик не найден'
      });
    }

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении поставщика',
      error: error.message
    });
  }
};

const createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Поставщик успешно создан',
      data: supplier
    });
  } catch (error) {
    // Проверка на дубликат уникального ключа
    if (error instanceof Sequelize.UniqueConstraintError) {
      return res.status(400).json({
        success: false,
        message: 'Поставщик с таким INN уже существует',
        errors: error.errors.map(e => e.message) // детализируем, какие поля
      });
    }

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании поставщика',
      error: error.message
    });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, ...data } = req.body;

    const result = await updateWithAudit({
      model: Supplier,
      id,
      data,
      entityType: 'supplier',
      action: 'supplier_updated',
      userId: req.user.id,
      comment
    });

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: 'Поставщик не найден'
      });
    }

    return res.json({
      success: true,
      message: result.changed
        ? 'Поставщик успешно обновлён'
        : 'Изменений не обнаружено',
      data: result.instance
    });

  } catch (error) {
    console.error('updateSupplier error:', error);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении поставщика',
      error: error.message
    });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const supplierId = Number(id);

    // Обновляем поле deleted вместо удаления записи
    const [updated] = await Supplier.update(
      { deleted: true },
      { where: { id: supplierId } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Поставщик не найден'
      });
    }
    res.json({
      success: true,
      message: 'Поставщик успешно удален'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении поставщика',
      error: error.message
    });
  }
};

module.exports = {
  getAllSuppliers,
  recommendSuppliers,
  searchSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
};