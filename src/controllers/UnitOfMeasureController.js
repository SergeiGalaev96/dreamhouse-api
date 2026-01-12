const { Op } = require("sequelize");
const UnitOfMeasure = require('../models/UnitOfMeasure');

const getAllUnitsOfMeasure = async (req, res) => {
  try {

    const whereClause = {deleted: false};

    const { count, rows } = await UnitOfMeasure.findAndCountAll({
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
      message: 'Ошибка сервера при получении единиц измерения',
      error: error.message
    });
  }
};

const searchUnitsOfMeasure = async (req, res) => {
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

    const { count, rows } = await UnitOfMeasure.findAndCountAll({
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
    console.error('Ошибка поиска единиц измерения:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при поиске единиц измерения',
      error: error.message
    });
  }
};

const getUnitOfMeasureById = async (req, res) => {
  try {
    const { id } = req.params;
    const unitOfMeasure = await UnitOfMeasure.findByPk(id);

    if (!unitOfMeasure) {
      return res.status(404).json({
        success: false,
        message: 'Единица измерения не найдена'
      });
    }

    res.json({
      success: true,
      data: unitOfMeasure
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении единицы измерения',
      error: error.message
    });
  }
};

const createUnitOfMeasure = async (req, res) => {
  try {
    const unitOfMeasure = await UnitOfMeasure.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Единица измерения успешно создана',
      data: unitOfMeasure
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании единицы измерения',
      error: error.message
    });
  }
};

const updateUnitOfMeasure = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await UnitOfMeasure.update(req.body, {
      where: { id: id }
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Единица измерения не найдена'
      });
    }

    const updatedUnitOfMeasure = await UnitOfMeasure.findByPk(id);
    
    res.json({
      success: true,
      message: 'Единица измерения успешно обновлена',
      data: updatedUnitOfMeasure
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении единицы измерения',
      error: error.message
    });
  }
};

const deleteUnitOfMeasure = async (req, res) => {
  try {
    const { id } = req.params;
    const unitOfMeasureId = Number(id);

    // Обновляем поле deleted вместо удаления записи
    const [updated] = await UnitOfMeasure.update(
      { deleted: true },
      { where: { id: unitOfMeasureId } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Единица измерения не найдена'
      });
    }

    return res.json({
      success: true,
      message: 'Единица измерения успешно удалена'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении единицы измерения',
      error: error.message
    });
  }
};

module.exports = {
  getAllUnitsOfMeasure,
  searchUnitsOfMeasure,
  getUnitOfMeasureById,
  createUnitOfMeasure,
  updateUnitOfMeasure,
  deleteUnitOfMeasure
};