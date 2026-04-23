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

        /* =========================
           ОБЪЁМЫ
        ========================== */
        COALESCE(v.planned_volume,0) AS planned_volume,
        COALESCE(v.done_volume,0) AS done_volume,

        /* =========================
           БЮДЖЕТ (ФАКТИЧЕСКИЙ 🔥)
        ========================== */
        (
          /* WORK PERFORMED */
          COALESCE((
            SELECT SUM(
              wpi.quantity *
              wpi.price *
              CASE
                WHEN wpi.currency = 1 THEN 1
                ELSE COALESCE(wpi.currency_rate, 1)
              END
            )
            FROM construction.work_performed wp
            LEFT JOIN construction.work_performed_items wpi
              ON wpi.work_performed_id = wp.id
              AND wpi.deleted = false
            WHERE wp.block_id = pb.id
              AND wp.deleted = false
              AND wp.status = 2
          ), 0)

          +

          /* PURCHASE ORDERS */
          COALESCE((
            SELECT SUM(
              poi.quantity *
              poi.price *
              CASE
                WHEN poi.currency = 1 THEN 1
                ELSE COALESCE(poi.currency_rate, 1)
              END
            )
            FROM construction.purchase_orders po
            LEFT JOIN construction.purchase_order_items poi
              ON poi.purchase_order_id = po.id
              AND poi.deleted = false
            WHERE po.block_id = pb.id
              AND po.deleted = false
              AND po.status IN (4, 5)
          ), 0)

        ) AS actual_budget,

        /* =========================
           ОСТАТОК
        ========================== */
        GREATEST(
          COALESCE(v.planned_volume,0) - COALESCE(v.done_volume,0),
          0
        ) AS remaining_volume,

        /* =========================
           ПРОГРЕСС
        ========================== */
        CASE
          WHEN COALESCE(v.planned_volume,0) = 0 THEN 0
          ELSE ROUND(
            (v.done_volume / v.planned_volume)::numeric * 100
          ,2)::double precision
        END AS progress_percent,

        /* =========================
           СЧЁТЧИКИ
        ========================== */
        COALESCE(v.services_count,0) AS services_count,
        COALESCE(v.materials_count,0) AS materials_count,
        COALESCE(s.subsections_count,0) AS subsections_count

      FROM construction.project_blocks pb

      /* =========================
         ОСНОВНАЯ АГРЕГАЦИЯ (объёмы)
      ========================== */
      LEFT JOIN (
        SELECT
          me.block_id,

          SUM(CASE WHEN mei.item_type = 2 THEN mei.quantity_planned ELSE 0 END) AS planned_volume,

          SUM(CASE WHEN mei.item_type = 2 THEN COALESCE(wpi_sum.done_quantity,0) ELSE 0 END) AS done_volume,

          COUNT(DISTINCT CASE WHEN mei.item_type = 2 THEN mei.id END) AS services_count,
          COUNT(DISTINCT CASE WHEN mei.item_type = 1 THEN mei.id END) AS materials_count

        FROM construction.material_estimates me

        LEFT JOIN construction.material_estimate_items mei
          ON mei.material_estimate_id = me.id
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

        WHERE me.deleted = false

        GROUP BY me.block_id

      ) v ON v.block_id = pb.id

      /* =========================
         ПОДРАЗДЕЛЫ
      ========================== */
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
  const transaction = await sequelize.transaction();
  try {
    const block = await ProjectBlock.create(
      {
        ...req.body,
        planned_budget: Number(req.body?.planned_budget || 0),
        total_area: Number(req.body?.total_area || 0),
        sale_area: Number(req.body?.sale_area || 0),
        deleted: false
      },
      { transaction }
    );

    await MaterialEstimate.create(
      {
        block_id: block.id,
        status: 1,
        created_user_id: req.user.id,
        name: `Смета ${block.name}`,
        deleted: false
      },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Блок успешно создан",
      data: block
    });

  } catch (error) {
    await transaction.rollback();
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
