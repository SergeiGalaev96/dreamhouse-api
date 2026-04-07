const sequelize = require('../config/database');

/* ============================================================
   WORK PERFORMED REPORT
============================================================ */
const getWorkPerformedReport = async (req, res) => {
  try {

    const { id } = req.params;

    /* ================= HEADER ================= */
    const header = await sequelize.query(
      `
      SELECT
        wp.*,

        /* проект и блок */
        p.name AS project_name,
        pb.name AS block_name,

        /* статус */
        CASE wp.status
          WHEN 1 THEN 'Создан'
          WHEN 2 THEN 'Подписан'
          WHEN 3 THEN 'В работе'
          WHEN 4 THEN 'Завершен'
          WHEN 5 THEN 'Отменен'
          ELSE 'Неизвестно'
        END AS status_name,

        /* ===== НАЗНАЧЕННЫЕ ===== */
        CONCAT(fu.first_name, ' ', fu.last_name) AS assigned_foreman_name,
        CONCAT(pu.first_name, ' ', pu.last_name) AS assigned_planning_engineer_name,
        CONCAT(mu.first_name, ' ', mu.last_name) AS assigned_main_engineer_name,

        /* ===== ПОДПИСАВШИЕ ===== */
        CASE 
          WHEN wp.signed_by_foreman = true 
          THEN CONCAT(fu.first_name, ' ', fu.last_name)
          ELSE NULL
        END AS foreman_name,

        CASE 
          WHEN wp.signed_by_planning_engineer = true 
          THEN CONCAT(pu.first_name, ' ', pu.last_name)
          ELSE NULL
        END AS planning_engineer_name,

        CASE 
          WHEN wp.signed_by_main_engineer = true 
          THEN CONCAT(mu.first_name, ' ', mu.last_name)
          ELSE NULL
        END AS main_engineer_name

      FROM construction.work_performed wp

      LEFT JOIN construction.project_blocks pb
        ON pb.id = wp.block_id

      LEFT JOIN construction.projects p
        ON p.id = wp.project_id

      LEFT JOIN construction.users fu
        ON fu.id = wp.foreman_user_id

      LEFT JOIN construction.users pu
        ON pu.id = wp.planning_engineer_user_id

      LEFT JOIN construction.users mu
        ON mu.id = wp.main_engineer_user_id

      WHERE wp.id = :id
        AND wp.deleted = false
      `,
      {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!header.length) {
      return res.status(404).json({
        success: false,
        message: 'Акт не найден'
      });
    }

    /* ================= ITEMS ================= */
    const items = await sequelize.query(
      `
      SELECT
        wpi.*,

        st.name AS service_type_name,
        s.name AS service_name,
        u.name AS unit_name,
        bs.name AS stage_name,
        ss.name AS subsection_name,

        CASE
          WHEN wpi.currency = 1 THEN wpi.price
          ELSE wpi.price * COALESCE(wpi.currency_rate, 1)
        END AS price_converted,

        (
          wpi.quantity *
          CASE
            WHEN wpi.currency = 1 THEN wpi.price
            ELSE wpi.price * COALESCE(wpi.currency_rate, 1)
          END
        ) AS total

      FROM construction.work_performed_items wpi

      LEFT JOIN construction.services s
        ON s.id = wpi.service_id

      LEFT JOIN construction.service_types st
        ON st.id = wpi.service_type

      LEFT JOIN construction.units_of_measure u
        ON u.id = wpi.unit_of_measure

      LEFT JOIN construction.block_stages bs
        ON bs.id = wpi.stage_id

      LEFT JOIN construction.stage_subsections ss
        ON ss.id = wpi.subsection_id

      WHERE wpi.work_performed_id = :id
        AND wpi.deleted = false

      ORDER BY wpi.created_at ASC
      `,
      {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const total = items.reduce((sum, i) => sum + Number(i.total || 0), 0);

    res.json({
      success: true,
      data: {
        header: header[0],
        items,
        total
      }
    });

  } catch (error) {

    console.error("Report error:", error);

    res.status(500).json({
      success: false,
      message: "Ошибка формирования отчета",
      error: error.message
    });

  }
};

module.exports = {
  getWorkPerformedReport
};
