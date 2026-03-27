const { Op, Sequelize } = require("sequelize");
const {
  sequelize,
  ProjectBlock,
  MaterialEstimate,
  MaterialEstimateItem,
  WorkPerformedItem,
  BlockStage,
  StageSubsection
} = require('../models');
const updateWithAudit = require("../utils/updateWithAudit");


// 🔹 Получить все блоки
const getAllProjectBlocks = async (req, res) => {
  try {
    const whereClause = { deleted: false };

    const { count, rows } = await ProjectBlock.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'ASC']]
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
      message: "Ошибка сервера при получении блоков",
      error: error.message
    });
  }
};


// 🔹 Поиск блоков
const searchProjectBlocks = async (req, res) => {
  try {

    const {
      search,
      project_id,
      page = 1,
      size = 10
    } = req.body;

    const limit = Number(size);
    const offset = (Number(page) - 1) * limit;

    const rows = await sequelize.query(
      `
      SELECT
        pb.id,
        pb.name,
        pb.project_id,

        pb.planned_budget,
        pb.total_area,
        pb.sale_area,

        pb.created_at,
        pb.updated_at,

        COALESCE(v.planned_volume,0) AS planned_volume,
        COALESCE(v.done_volume,0) AS done_volume,

        COALESCE(v.actual_budget,0) AS actual_budget,

        COALESCE(v.planned_volume,0) -
        COALESCE(v.done_volume,0) AS remaining_volume,

        CASE
          WHEN COALESCE(v.planned_volume,0) = 0
          THEN 0
          ELSE ROUND(
            (v.done_volume / v.planned_volume)::numeric * 100
          ,2)::double precision
        END AS progress_percent,

        COALESCE(v.services_count,0) AS services_count,
        COALESCE(s.subsections_count,0) AS subsections_count

      FROM construction.project_blocks pb

      LEFT JOIN (
        SELECT
          me.block_id,

          SUM(mei.quantity_planned) AS planned_volume,
          SUM(wpi.quantity) AS done_volume,

          SUM(wpi.quantity * mei.price) AS actual_budget,

          COUNT(DISTINCT mei.id) AS services_count

        FROM construction.material_estimates me

        LEFT JOIN construction.material_estimate_items mei
          ON mei.material_estimate_id = me.id
          AND mei.item_type = 2
          AND mei.deleted = false

        LEFT JOIN construction.work_performed_items wpi
          ON wpi.material_estimate_item_id = mei.id
          AND wpi.deleted = false

        WHERE me.deleted = false

        GROUP BY me.block_id

      ) v ON v.block_id = pb.id

      LEFT JOIN (
        SELECT
          bs.block_id,
          COUNT(DISTINCT ss.id) AS subsections_count
        FROM construction.block_stages bs
        LEFT JOIN construction.stage_subsections ss
          ON ss.stage_id = bs.id
          AND ss.deleted = false
        GROUP BY bs.block_id
      ) s ON s.block_id = pb.id

      WHERE pb.deleted = false
      ${project_id ? "AND pb.project_id = :project_id" : ""}
      ${search ? "AND pb.name ILIKE :search" : ""}

      ORDER BY pb.created_at ASC

      LIMIT :limit OFFSET :offset
      `,
      {
        replacements: {
          project_id,
          search: search ? `%${search}%` : null,
          limit,
          offset
        },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    const total = await sequelize.query(
      `
      SELECT COUNT(*)::int AS total
      FROM construction.project_blocks pb
      WHERE pb.deleted = false
      ${project_id ? "AND pb.project_id = :project_id" : ""}
      ${search ? "AND pb.name ILIKE :search" : ""}
      `,
      {
        replacements: {
          project_id,
          search: search ? `%${search}%` : null
        },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    const count = total[0]?.total || 0;

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: Number(page),
        size: limit,
        total: count,
        pages: Math.ceil(count / limit),
        hasNext: page * limit < count,
        hasPrev: page > 1
      }
    });

  } catch (error) {

    console.error("Ошибка при поиске блоков:", error);

    res.status(500).json({
      success: false,
      message: "Ошибка сервера при поиске блоков",
      error: error.message
    });

  }
};

module.exports = {
  searchProjectBlocks
};

module.exports = {
  searchProjectBlocks
};


// 🔹 Получить блок по ID
const getProjectBlockById = async (req, res) => {
  try {
    const { id } = req.params;

    const block = await ProjectBlock.findOne({
      where: {
        id,
        deleted: false
      }
    });

    if (!block) {
      return res.status(404).json({
        success: false,
        message: "Блок не найден"
      });
    }

    res.json({
      success: true,
      data: block
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при получении блока",
      error: error.message
    });
  }
};


// 🔹 Создание блока
const createProjectBlock = async (req, res) => {
  try {
    const block = await ProjectBlock.create(req.body);

    res.status(201).json({
      success: true,
      message: "Блок успешно создан",
      data: block
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при создании блока",
      error: error.message
    });
  }
};


// 🔹 Обновление блока
const updateProjectBlock = async (req, res) => {
  try {
    const result = await updateWithAudit({
      model: ProjectBlock,
      id: req.params.id,
      data: req.body,
      entityType: "project_block",
      action: "project_block_updated",
      userId: req.user.id,
      comment: req.body.comment
    });

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: "Блок не найден"
      });
    }

    return res.json({
      success: true,
      message: result.changed
        ? "Блок успешно обновлён"
        : "Изменений не обнаружено",
      data: result.instance
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при обновлении блока",
      error: error.message
    });
  }
};


// 🔹 Удаление блока (soft delete)
const deleteProjectBlock = async (req, res) => {
  try {
    const { id } = req.params;

    const [updated] = await ProjectBlock.update(
      { deleted: true },
      { where: { id } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Блок не найден"
      });
    }

    res.json({
      success: true,
      message: "Блок успешно удалён"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при удалении блока",
      error: error.message
    });
  }
};


module.exports = {
  getAllProjectBlocks,
  searchProjectBlocks,
  getProjectBlockById,
  createProjectBlock,
  updateProjectBlock,
  deleteProjectBlock
};