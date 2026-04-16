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

    if (status) whereClause.status = status;
    if (type) whereClause.type = type;

    const { count, rows } = await Project.findAndCountAll({

      where: whereClause,
      limit: Number(size),
      offset: Number(offset),
      order: [["created_at", "DESC"]],

      attributes: {
        include: [

          /* =========================
             ПРОГРЕСС (FIXED 🔥)
          ========================== */
          [
            Sequelize.literal(`
              COALESCE((
                SELECT
                  CASE
                    WHEN SUM(mei.quantity_planned) = 0 THEN 0
                    ELSE ROUND(
                      (
                        SUM(COALESCE(wpi_sum.done_quantity,0))::numeric /
                        NULLIF(SUM(mei.quantity_planned)::numeric, 0)
                      ) * 100
                    , 2)
                  END
                FROM construction.project_blocks pb
                LEFT JOIN construction.material_estimates me
                  ON me.block_id = pb.id AND me.deleted = false
                LEFT JOIN construction.material_estimate_items mei
                  ON mei.material_estimate_id = me.id
                  AND mei.item_type = 2
                  AND mei.deleted = false
                LEFT JOIN (
                  SELECT
                    wpi.material_estimate_item_id,
                    SUM(wpi.quantity) AS done_quantity
                  FROM construction.work_performed_items wpi
                  JOIN construction.work_performed wp
                    ON wp.id = wpi.work_performed_id
                    AND wp.deleted = false
                    AND wp.status = 2
                  WHERE wpi.deleted = false
                  GROUP BY wpi.material_estimate_item_id
                ) wpi_sum
                  ON wpi_sum.material_estimate_item_id = mei.id
                WHERE pb.project_id = "Project".id
                  AND pb.deleted = false
              ),0)
            `),
            "progress_percent"
          ],

          /* =========================
             БЮДЖЕТ
          ========================== */
          [
            Sequelize.literal(`
              COALESCE((
                SELECT SUM(
                  wpi.quantity * wpi.price *
                  CASE
                    WHEN wpi.currency = 1 THEN 1
                    ELSE COALESCE(wpi.currency_rate, 1)
                  END
                )
                FROM construction.project_blocks pb
                LEFT JOIN construction.work_performed wp
                  ON wp.block_id = pb.id
                  AND wp.deleted = false
                  AND wp.status = 2
                LEFT JOIN construction.work_performed_items wpi
                  ON wpi.work_performed_id = wp.id AND wpi.deleted = false
                WHERE pb.project_id = "Project".id
                  AND pb.deleted = false
              ),0)
              +
              COALESCE((
                SELECT SUM(
                  poi.quantity * poi.price *
                  CASE
                    WHEN poi.currency = 1 THEN 1
                    ELSE COALESCE(poi.currency_rate, 1)
                  END
                )
                FROM construction.project_blocks pb
                LEFT JOIN construction.purchase_orders po
                  ON po.block_id = pb.id
                  AND po.deleted = false
                  AND po.status IN (4,5)
                LEFT JOIN construction.purchase_order_items poi
                  ON poi.purchase_order_id = po.id AND poi.deleted = false
                WHERE pb.project_id = "Project".id
                  AND pb.deleted = false
              ),0)
            `),
            "actual_budget"
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
                  CASE
                    WHEN SUM(mei.quantity_planned) = 0 THEN 0
                    ELSE ROUND(
                      (
                        SUM(COALESCE(wpi_sum.done_quantity,0))::numeric /
                        NULLIF(SUM(mei.quantity_planned)::numeric, 0)
                      ) * 100
                    , 2)
                  END
                FROM construction.project_blocks pb
                LEFT JOIN construction.material_estimates me
                  ON me.block_id = pb.id AND me.deleted = false
                LEFT JOIN construction.material_estimate_items mei
                  ON mei.material_estimate_id = me.id
                  AND mei.item_type = 2
                  AND mei.deleted = false
                LEFT JOIN (
                  SELECT
                    wpi.material_estimate_item_id,
                    SUM(wpi.quantity) AS done_quantity
                  FROM construction.work_performed_items wpi
                  JOIN construction.work_performed wp
                    ON wp.id = wpi.work_performed_id
                    AND wp.deleted = false
                    AND wp.status = 2
                  WHERE wpi.deleted = false
                  GROUP BY wpi.material_estimate_item_id
                ) wpi_sum
                  ON wpi_sum.material_estimate_item_id = mei.id
                WHERE pb.project_id = "Project".id
                  AND pb.deleted = false
              ),0)
            `),
            "progress_percent"
          ],

          [
            Sequelize.literal(`
              COALESCE((
                SELECT SUM(
                  wpi.quantity * wpi.price *
                  CASE
                    WHEN wpi.currency = 1 THEN 1
                    ELSE COALESCE(wpi.currency_rate, 1)
                  END
                )
                FROM construction.project_blocks pb
                LEFT JOIN construction.work_performed wp
                  ON wp.block_id = pb.id
                  AND wp.deleted = false
                  AND wp.status = 2
                LEFT JOIN construction.work_performed_items wpi
                  ON wpi.work_performed_id = wp.id AND wpi.deleted = false
                WHERE pb.project_id = "Project".id
                  AND pb.deleted = false
              ),0)
              +
              COALESCE((
                SELECT SUM(
                  poi.quantity * poi.price *
                  CASE
                    WHEN poi.currency = 1 THEN 1
                    ELSE COALESCE(poi.currency_rate, 1)
                  END
                )
                FROM construction.project_blocks pb
                LEFT JOIN construction.purchase_orders po
                  ON po.block_id = pb.id
                  AND po.deleted = false
                  AND po.status IN (4,5)
                LEFT JOIN construction.purchase_order_items poi
                  ON poi.purchase_order_id = po.id AND poi.deleted = false
                WHERE pb.project_id = "Project".id
                  AND pb.deleted = false
              ),0)
            `),
            "actual_budget"
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
