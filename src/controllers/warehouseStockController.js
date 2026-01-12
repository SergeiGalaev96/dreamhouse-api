const WarehouseStock = require('../models/WarehouseStock');

const getAllWarehouseStocks = async (req, res) => {
  try {
    const whereClause = {deleted: false};
    const { count, rows } = await WarehouseStock.findAndCountAll({
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
      message: 'Ошибка сервера при получении запасов',
      error: error.message
    });
  }
};

const searchWarehouseStocks = async (req, res) => {
  try {
    const {
      warehouse_id,
      material_id,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;
    const whereClause = {deleted: false};

    // if (name)
    //   whereClause.name = { [Op.iLike]: `%${name}%` };

    if (warehouse_id)
      whereClause.warehouse_id = warehouse_id
    if (material_id)
      whereClause.material_id = material_id 

    const { count, rows } = await WarehouseStock.findAndCountAll({
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
    console.error("Ошибка при поиске запасов:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при поиске запасов",
      error: error.message,
    });
  }
};

const getWarehouseStockById = async (req, res) => {
  try {
    const { id } = req.params;
    const warehouse = await WarehouseStock.findByPk(id);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Запас не найден'
      });
    }

    res.json({
      success: true,
      data: warehouse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении запаса',
      error: error.message
    });
  }
};

const createWarehouseStock = async (req, res) => {
  try {
    const warehouse = await WarehouseStock.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Запас успешно создан',
      data: warehouse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании запаса',
      error: error.message
    });
  }
};

const updateWarehouseStock = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await WarehouseStock.update(req.body, {
      where: { warehouse_id: id }
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Запас не найден'
      });
    }

    const updatedWarehouseStock = await WarehouseStock.findByPk(id);
    
    res.json({
      success: true,
      message: 'Запас успешно обновлен',
      data: updatedWarehouseStock
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении запаса',
      error: error.message
    });
  }
};

const deleteWarehouseStock = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await WarehouseStock.destroy({
      where: { warehouse_id: id }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Запас не найден'
      });
    }

    res.json({
      success: true,
      message: 'Запас успешно удален'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении запаса',
      error: error.message
    });
  }
};

module.exports = {
  getAllWarehouseStocks,
  searchWarehouseStocks,
  getWarehouseStockById,
  createWarehouseStock,
  updateWarehouseStock,
  deleteWarehouseStock
};