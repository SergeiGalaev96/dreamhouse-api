const ProjectType = require('../models/ProjectType');
const { Op } = require("sequelize");

const getAllProjectTypes = async (req, res) => {
  try {
    const whereClause = {deleted: false};

    const { count, rows } = await ProjectType.findAndCountAll({
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
      message: 'Ошибка сервера при получении типов проектов',
      error: error.message
    });
  }
};

const searchProjectTypes = async (req, res) => {
  try {
    const {
      name,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;
    const whereClause = {deleted: false};


    if (name)
      whereClause.name = { [Op.iLike]: `%${name}%` };

    const { count, rows } = await ProjectType.findAndCountAll({
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
    console.error("Ошибка при поиске проектов:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при поиске проектов",
      error: error.message,
    });
  }
};

const getProjectTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const projectType = await ProjectType.findByPk(id);

    if (!projectType) {
      return res.status(404).json({
        success: false,
        message: 'Тип проекта не найден'
      });
    }

    res.json({
      success: true,
      data: projectType
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении типа проекта',
      error: error.message
    });
  }
};

const createProjectType = async (req, res) => {
  try {
    const projectType = await ProjectType.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Тип проекта успешно создан',
      data: projectType
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании типа проекта',
      error: error.message
    });
  }
};

const updateProjectType = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await ProjectType.update(req.body, {
      where: { id: id }
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Тип проекта не найден'
      });
    }

    const updatedProject = await ProjectType.findByPk(id);
    
    res.json({
      success: true,
      message: 'Тип проекта успешно обновлен',
      data: updatedProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении типа проекта',
      error: error.message
    });
  }
};

const deleteProjectType = async (req, res) => {
  try {
    const { id } = req.params;
    const projectTypeId = Number(id);

    // Обновляем поле deleted вместо удаления записи
    const [updated] = await ProjectType.update(
      { deleted: true },
      { where: { id: projectTypeId } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Тип проекта не найден'
      });
    }

    res.json({
      success: true,
      message: 'Тип проекта успешно удален'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении типа проекта',
      error: error.message
    });
  }
};

module.exports = {
  getAllProjectTypes,
  searchProjectTypes,
  getProjectTypeById,
  createProjectType,
  updateProjectType,
  deleteProjectType
};