const { Op, Sequelize } = require("sequelize");
const { Project } = require("../models");
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

    if (status)
      whereClause.status = status;

    if (type)
      whereClause.type = type;

    const { count, rows } = await Project.findAndCountAll({

      where: whereClause,

      limit: Number(size),
      offset: Number(offset),

      order: [["created_at", "DESC"]],

      attributes: {

        include: [

          [
            Sequelize.literal(`
              COALESCE((
                SELECT
                  ROUND(
                    (
                      SUM(wpi.quantity)::float /
                      NULLIF(SUM(mei.quantity_planned),0)
                    )::numeric * 100
                  ,2)::double precision
                FROM construction.project_blocks pb
                LEFT JOIN construction.material_estimates me
                  ON me.block_id = pb.id
                  AND me.deleted = false
                LEFT JOIN construction.material_estimate_items mei
                  ON mei.material_estimate_id = me.id
                  AND mei.item_type = 2
                  AND mei.deleted = false
                LEFT JOIN construction.work_performed_items wpi
                  ON wpi.material_estimate_item_id = mei.id
                  AND wpi.deleted = false
                WHERE pb.project_id = "Project".id
                AND pb.deleted = false
              ),0)
            `),
            "progress_percent"
          ]

        ]

      }

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

    const project = await Project.findByPk(id, {

      attributes: {
        include: [
          [
            Sequelize.literal(`
              COALESCE((
                SELECT
                  ROUND(
                    (
                      SUM(wpi.quantity)::float /
                      NULLIF(SUM(mei.quantity_planned),0)
                    )::numeric * 100
                  ,2)::double precision
                FROM construction.project_blocks pb
                LEFT JOIN construction.material_estimates me
                  ON me.block_id = pb.id
                  AND me.deleted = false
                LEFT JOIN construction.material_estimate_items mei
                  ON mei.material_estimate_id = me.id
                  AND mei.item_type = 2
                  AND mei.deleted = false
                LEFT JOIN construction.work_performed_items wpi
                  ON wpi.material_estimate_item_id = mei.id
                  AND wpi.deleted = false
                WHERE pb.project_id = "Project".id
                AND pb.deleted = false
              ),0)
            `),
            "progress_percent"
          ]
        ]
      }

    });

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

    console.error("Ошибка получения проекта:", error);

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