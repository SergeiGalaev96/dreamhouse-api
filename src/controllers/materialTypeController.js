const { Op } = require("sequelize");
const MaterialType = require('../models/MaterialType');

const getAllMaterialTypes = async (req, res) => {
  try {

    const whereClause = {deleted: false};

    const { count, rows } = await MaterialType.findAndCountAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении материалов',
      error: error.message
    });
  }
};

const searchMaterialTypes = async (req, res) => {
  try {
    const {
      name,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;

    const whereClause = {
      deleted: false
    };

    if (name)
      whereClause.name = { [Op.iLike]: `%${name}%` };

    const { count, rows } = await MaterialType.findAndCountAll({
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
    console.error('Ошибка поиска материалов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при поиске материалов',
      error: error.message
    });
  }
};

const getMaterialTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const materialType = await MaterialType.findByPk(id);

    if (!materialType) {
      return res.status(404).json({
        success: false,
        message: 'Материал не найден'
      });
    }

    res.json({
      success: true,
      data: materialType
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении материала',
      error: error.message
    });
  }
};

const createMaterialType = async (req, res) => {
  try {
    const materialType = await MaterialType.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Тип материала успешно создан',
      data: materialType
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании типа материала',
      error: error.message
    });
  }
};

const updateMaterialType = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await MaterialType.update(req.body, {
      where: { id: id }
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Тип материала не найден'
      });
    }

    const updatedMaterialType = await MaterialType.findByPk(id);
    
    res.json({
      success: true,
      message: 'Тип материала успешно обновлен',
      data: updatedMaterialType
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении типа материала',
      error: error.message
    });
  }
};

const deleteMaterialType = async (req, res) => {
  try {
    const { id } = req.params;
    const materialTypeId = Number(id);

    // Обновляем поле deleted вместо удаления записи
    const [updated] = await MaterialType.update(
      { deleted: true },
      { where: { id: materialTypeId } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Тип материала не найден'
      });
    }

    return res.json({
      success: true,
      message: 'Тип материала успешно удален'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении типа материала',
      error: error.message
    });
  }
};

module.exports = {
  getAllMaterialTypes,
  searchMaterialTypes,
  getMaterialTypeById,
  createMaterialType,
  updateMaterialType,
  deleteMaterialType
};