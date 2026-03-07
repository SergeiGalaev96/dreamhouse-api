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

    const offset = (page - 1) * size;

    const whereClause = {
      deleted: false
    };

    if (search && search.trim() !== "") {
      whereClause.name = {
        [Op.iLike]: `%${search.trim()}%`
      };
    }

    if (project_id) {
      whereClause.project_id = project_id;
    }

    const rows = await sequelize.query(
      `
      SELECT
        pb.id,
        pb.name,
        pb.project_id,
        pb.created_at,

        COALESCE(SUM(mei.quantity_planned),0) AS planned_volume,
        COALESCE(SUM(wpi.quantity),0) AS done_volume,

        COALESCE(SUM(mei.quantity_planned),0) -
        COALESCE(SUM(wpi.quantity),0) AS remaining_volume,

        CASE
          WHEN COALESCE(SUM(mei.quantity_planned),0) = 0
          THEN 0
          ELSE ROUND(
            (COALESCE(SUM(wpi.quantity),0) /
            SUM(mei.quantity_planned))::numeric * 100
          ,2)::double precision
        END AS progress_percent,

        COUNT(DISTINCT mei.id) AS services_count,
        COUNT(DISTINCT ss.id) AS subsections_count

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

      LEFT JOIN construction.block_stages bs
        ON bs.block_id = pb.id

      LEFT JOIN construction.stage_subsections ss
        ON ss.stage_id = bs.id
        AND ss.deleted = false

      WHERE pb.deleted = false
      ${project_id ? "AND pb.project_id = :project_id" : ""}
      ${search ? "AND pb.name ILIKE :search" : ""}

      GROUP BY pb.id

      ORDER BY pb.created_at ASC

      LIMIT :size OFFSET :offset
      `,
      {
        replacements: {
          project_id,
          search: `%${search}%`,
          size: Number(size),
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
          search: `%${search}%`
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
        size: Number(size),
        total: count,
        pages: Math.ceil(count / size),
        hasNext: page * size < count,
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