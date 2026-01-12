const { Op } = require("sequelize");
const Material = require('../models/Material');

const getAllMaterials = async (req, res) => {
  try {
    const whereClause = { deleted: false };
    const { count, rows } = await Material.findAndCountAll({
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

const searchMaterials = async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      type,
      unit_of_measure,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;

    const whereClause = {
      deleted: false
    };

    if (name)
      whereClause.name = { [Op.iLike]: `%${name}%` };
    if (code)
      whereClause.code = { [Op.iLike]: `%${code}%` };
    if (description)
      whereClause.description = { [Op.iLike]: `%${description}%` };

    if (type) whereClause.type = type;
    if (unit_of_measure) whereClause.unit_of_measure = unit_of_measure;

    const { count, rows } = await Material.findAndCountAll({
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

const getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await Material.findByPk(id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Материал не найден'
      });
    }

    res.json({
      success: true,
      data: material
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении материала',
      error: error.message
    });
  }
};

const createMaterial = async (req, res) => {
  try {
    const material = await Material.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Материал успешно создан',
      data: material
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании материала',
      error: error.message
    });
  }
};

const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Material.update(req.body, {
      where: { id: id }
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Материал не найден'
      });
    }

    const updatedMaterial = await Material.findByPk(id);

    res.json({
      success: true,
      message: 'Материал успешно обновлен',
      data: updatedMaterial
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении материала',
      error: error.message
    });
  }
};

const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const materiaId = Number(id);

    // Обновляем поле deleted вместо удаления записи
    const [updated] = await Material.update(
      { deleted: true },
      { where: { id: materiaId } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Материал не найден'
      });
    }

    return res.json({
      success: true,
      message: 'Материал успешно удален'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении материала',
      error: error.message
    });
  }
};

module.exports = {
  getAllMaterials,
  searchMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial
};