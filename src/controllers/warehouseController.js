const Warehouse = require('../models/Warehouse');

const getAllWarehouses = async (req, res) => {
  try {
    // const { page = 1, size = 10} = req.query;
    // const offset = (page - 1) * size;

    const whereClause = {deleted: false};

    const { count, rows } = await Warehouse.findAndCountAll({
      where: whereClause,
      // size: parseInt(size),
      // offset: parseInt(offset),
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        // page: parseInt(page),
        // size: parseInt(size),
        total: count,
        // pages: Math.ceil(count / size)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении складов',
      error: error.message
    });
  }
};

const searchWarehouses = async (req, res) => {
  try {
    const {
      project_id,
      manager_id,
      name,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;
    const whereClause = {deleted: false};

    
    if (project_id)
      whereClause.project_id = project_id
    if (manager_id)
      whereClause.manager_id = manager_id
    if (name)
      whereClause.name = { [Op.iLike]: `%${name}%` };


    const { count, rows } = await Warehouse.findAndCountAll({
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

const getWarehouseById = async (req, res) => {
  try {
    const { id } = req.params;
    const warehouse = await Warehouse.findByPk(id);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Склад не найден'
      });
    }

    res.json({
      success: true,
      data: warehouse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении склада',
      error: error.message
    });
  }
};

const createWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Склад успешно создан',
      data: warehouse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании склада',
      error: error.message
    });
  }
};

const updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Warehouse.update(req.body, {
      where: { id: id }
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Склад не найден'
      });
    }

    const updatedWarehouse = await Warehouse.findByPk(id);
    
    res.json({
      success: true,
      message: 'Склад успешно обновлен',
      data: updatedWarehouse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении склада',
      error: error.message
    });
  }
};

const deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Warehouse.destroy({
      where: { id: id }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Склад не найден'
      });
    }

    res.json({
      success: true,
      message: 'Склад успешно удален'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении склада',
      error: error.message
    });
  }
};

module.exports = {
  getAllWarehouses,
  searchWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse
};