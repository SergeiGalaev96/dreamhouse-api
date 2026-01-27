const Supplier = require('../models/Supplier');
const { Op } = require("sequelize");
const { Sequelize } = require('sequelize');

const getAllSuppliers = async (req, res) => {
  try {
    const whereClause = { deleted: false };

    const { count, rows } = await Supplier.findAndCountAll({
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
      message: 'Ошибка сервера при получении поставщиков',
      error: error.message
    });
  }
};

const searchSuppliers = async (req, res) => {
  try {
    const {
      search,
      // name,
      // inn,
      // address,
      // phone,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;
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
        { ogrn: { [Op.iLike]: s } },
      ];
    }
    // if (name)
    //   whereClause.name = { [Op.iLike]: `%${name}%` };

    // if (inn)
    //   whereClause.inn = { [Op.iLike]: `%${inn}%` };

    // if (address)
    //   whereClause.address = { [Op.iLike]: `%${address}%` };

    // if (status)
    //   whereClause.status = status;

    // if (type)
    //   whereClause.type = type;


    // if (start_date_from || start_date_to) {
    //   whereClause.start_date = {};
    //   if (start_date_from) whereClause.start_date[Op.gte] = start_date_from;
    //   if (start_date_to) whereClause.start_date[Op.lte] = start_date_to;
    // }

    const { count, rows } = await Supplier.findAndCountAll({
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
    console.error("Ошибка при поиске поставщиков:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при поиске поставщиков",
      error: error.message,
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
    const [updated] = await Supplier.update(req.body, {
      where: { id: id }
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Поставщик не найден'
      });
    }

    const updatedSupplier = await Supplier.findByPk(id);

    res.json({
      success: true,
      message: 'Поставщик успешно обновлен',
      data: updatedSupplier
    });
  } catch (error) {
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
  searchSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
};