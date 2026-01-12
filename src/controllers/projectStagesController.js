const ProjectStage = require('../models/ProjectStage');
const { Op } = require("sequelize");

const getAllProjectStages = async (req, res) => {
  try {
    const whereClause = {deleted: false};

    const { count, rows } = await ProjectStage.findAndCountAll({
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
      message: 'Ошибка сервера при получении этапов проектов',
      error: error.message
    });
  }
};

const searchProjectStages = async (req, res) => {
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

    const { count, rows } = await ProjectStage.findAndCountAll({
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

const getProjectStageById = async (req, res) => {
  try {
    const { id } = req.params;
    const projectStage = await ProjectStage.findByPk(id);

    if (!projectStage) {
      return res.status(404).json({
        success: false,
        message: 'Этап проекта не найден'
      });
    }

    res.json({
      success: true,
      data: projectStage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении этапа проекта',
      error: error.message
    });
  }
};

const createProjectStage = async (req, res) => {
  try {
    const projectStage = await ProjectStage.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Этап проекта успешно создан',
      data: projectStage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании этапа проекта',
      error: error.message
    });
  }
};

const updateProjectStage = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await ProjectStage.update(req.body, {
      where: { id: id }
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Этап проекта не найден'
      });
    }

    const updatedProject = await ProjectStage.findByPk(id);
    
    res.json({
      success: true,
      message: 'Этап проекта успешно обновлен',
      data: updatedProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении этапа проекта',
      error: error.message
    });
  }
};

const deleteProjectStage = async (req, res) => {
  try {
    const { id } = req.params;
    const projectStageId = Number(id);

    // Обновляем поле deleted вместо удаления записи
    const [updated] = await ProjectStage.update(
      { deleted: true },
      { where: { id: projectStageId } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Этап проекта не найден'
      });
    }

    res.json({
      success: true,
      message: 'Этап проекта успешно удален'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении этапа проекта',
      error: error.message
    });
  }
};

module.exports = {
  getAllProjectStages,
  searchProjectStages,
  getProjectStageById,
  createProjectStage,
  updateProjectStage,
  deleteProjectStage
};