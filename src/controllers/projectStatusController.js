const Project = require('../models/ProjectStatus');
const { Op } = require("sequelize");

const getAllProjectStatuses = async (req, res) => {
  try {

    const whereClause = {deleted: false};

    const { count, rows } = await Project.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        // pages: Math.ceil(count / size)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении статусов проектов',
      error: error.message
    });
  }
};

const getProjectStatusById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Статус проекта не найден'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении статуса проекта',
      error: error.message
    });
  }
};

const createProjectStatus = async (req, res) => {
  try {
    const project = await Project.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Статус проекта успешно создан',
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании статуса проекта',
      error: error.message
    });
  }
};

const updateProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Project.update(req.body, {
      where: { id: id }
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Статус проекта не найден'
      });
    }

    const updatedProject = await Project.findByPk(id);
    
    res.json({
      success: true,
      message: 'Статус проекта успешно обновлен',
      data: updatedProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении статуса проекта',
      error: error.message
    });
  }
};

const deleteProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Project.destroy({
      where: { id: id }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Статус проекта не найден'
      });
    }

    res.json({
      success: true,
      message: 'Статус проекта успешно удален'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении статуса проекта',
      error: error.message
    });
  }
};

module.exports = {
  getAllProjectStatuses,
  getProjectStatusById,
  createProjectStatus,
  updateProjectStatus,
  deleteProjectStatus
};