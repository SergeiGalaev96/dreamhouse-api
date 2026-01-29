const { Op } = require("sequelize");
const Project = require('../models/Project');
const updateWithAudit = require('../utils/updateWithAudit');

const getAllProjects = async (req, res) => {
  try {
    const whereClause = { deleted: false };

    const { count, rows } = await Project.findAndCountAll({
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
      message: 'Ошибка сервера при получении проектов',
      error: error.message
    });
  }
};

const searchProjects = async (req, res) => {
  try {
    const {
      search,
      // name,
      // code,
      // address,
      type,
      status,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;
    const whereClause = { deleted: false };



    if (search && search.trim() !== "") {
      const s = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { name: { [Op.iLike]: s } },
        { code: { [Op.iLike]: s } },
        { address: { [Op.iLike]: s } }
      ];
    }
    // if (name)
    //   whereClause.name = { [Op.iLike]: `%${name}%` };

    // if (code)
    //   whereClause.code = { [Op.iLike]: `%${code}%` };

    // if (address)
    //   whereClause.address = { [Op.iLike]: `%${address}%` };

    if (status)
      whereClause.status = status;

    if (type)
      whereClause.type = type;


    // if (start_date_from || start_date_to) {
    //   whereClause.start_date = {};
    //   if (start_date_from) whereClause.start_date[Op.gte] = start_date_from;
    //   if (start_date_to) whereClause.start_date[Op.lte] = start_date_to;
    // }

    const { count, rows } = await Project.findAndCountAll({
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

const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Проект не найден'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении проекта',
      error: error.message
    });
  }
};

const createProject = async (req, res) => {
  try {
    const project = await Project.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Проект успешно создан',
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании проекта',
      error: error.message
    });
  }
};

const updateProject = async (req, res) => {
  try {
    const result = await updateWithAudit({
      model: Project,
      id: req.params.id,
      data: req.body,
      entityType: 'project',
      action: 'project_updated',
      userId: req.user.id,
      comment: req.body.comment
    });

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: 'Проект не найден'
      });
    }

    return res.json({
      success: true,
      message: result.changed
        ? 'Проект успешно обновлён'
        : 'Изменений не обнаружено',
      data: result.instance
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении проекта',
      error: error.message
    });
  }
};


const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const projectId = Number(id);

    // Обновляем поле deleted вместо удаления записи
    const [updated] = await Project.update(
      { deleted: true },
      { where: { id: projectId } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Проект не найден'
      });
    }
    res.json({
      success: true,
      message: 'Проект успешно удален'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении проекта',
      error: error.message
    });
  }
};

module.exports = {
  getAllProjects,
  searchProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
};