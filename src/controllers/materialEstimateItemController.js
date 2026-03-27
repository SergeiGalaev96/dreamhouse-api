const { Sequelize } = require("sequelize");
const { Op } = require("sequelize");
const {
  sequelize,
  MaterialEstimateItem,
  Currency
} = require('../models');

const updateWithAudit = require('../utils/updateWithAudit');

const getAllMaterialEstimateItems = async (req, res) => {
  try {
    const { count, rows } = await MaterialEstimateItem.findAndCountAll({
      where: { deleted: false },
      distinct: true,
      col: 'id',
      order: [['material_estimate_id', 'ASC']]
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
      message: 'Ошибка сервера при получении позиций сметы',
      error: error.message
    });
  }
};

const searchMaterialEstimateItems = async (req, res) => {
  try {

    const {
      project_id,
      block_id,
      item_type,
      material_name,
      service_name,
      page = 1,
      size = 20
    } = req.body;

    const offset = (page - 1) * size;

    const rows = await sequelize.query(
      `
      SELECT
        mei.*,

        /* =========================
           REQUESTED / DONE
        ========================== */

        CASE
          WHEN mei.item_type = 1
            THEN COALESCE(SUM(mri.quantity),0)
          WHEN mei.item_type = 2
            THEN COALESCE(SUM(wpi.quantity),0)
          ELSE 0
        END AS requested,

        /* =========================
           REMAINING
        ========================== */

        CASE
          WHEN mei.item_type = 1
            THEN mei.quantity_planned - COALESCE(SUM(mri.quantity),0)
          WHEN mei.item_type = 2
            THEN mei.quantity_planned - COALESCE(SUM(wpi.quantity),0)
          ELSE mei.quantity_planned
        END AS remaining,

        COUNT(*) OVER() AS total_count

      FROM construction.material_estimate_items mei

      JOIN construction.material_estimates me
        ON me.id = mei.material_estimate_id
        AND me.deleted = false

      JOIN construction.project_blocks pb
        ON pb.id = me.block_id
        AND pb.deleted = false

      /* материалы */
      LEFT JOIN construction.material_request_items mri
        ON mri.material_estimate_item_id = mei.id
        AND mri.deleted = false

      /* выполненные работы */
      LEFT JOIN construction.work_performed_items wpi
        ON wpi.material_estimate_item_id = mei.id
        AND wpi.deleted = false

      /* справочник материалов */
      LEFT JOIN construction.materials m
        ON m.id = mei.material_id

      WHERE mei.deleted = false
      ${item_type != null ? "AND mei.item_type = :item_type" : ""}
      ${project_id ? "AND pb.project_id = :project_id" : ""}
      ${block_id ? "AND pb.id = :block_id" : ""}
      ${material_name ? "AND m.name ILIKE :material_name" : ""}
      ${service_name ? "AND mei.name ILIKE :service_name" : ""}

      GROUP BY mei.id

      ORDER BY mei.id

      LIMIT :size OFFSET :offset
      `,
      {
        replacements: {
          project_id,
          block_id,
          item_type,
          material_name: material_name ? `%${material_name}%` : undefined,
          service_name: service_name ? `%${service_name}%` : undefined,
          size: Number(size),
          offset
        },
        model: MaterialEstimateItem,
        mapToModel: true
      }
    );

    const count = rows.length > 0 ? Number(rows[0].total_count) : 0;

    const cleanedRows = rows.map(r => {
      delete r.total_count;
      return r;
    });

    res.json({
      success: true,
      data: cleanedRows,
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

    console.error("Ошибка поиска материалов сметы:", error);

    res.status(500).json({
      success: false,
      message: "Ошибка сервера при поиске материалов сметы",
      error: error.message
    });

  }
};

const getMaterialEstimateItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await MaterialEstimateItem.findOne({
      where: {
        id,
        deleted: false
      }
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Позиция сметы не найдена'
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении позиции сметы',
      error: error.message
    });
  }
};

const createMaterialEstimateItems = async (req, res) => {

  const transaction = await sequelize.transaction();

  try {

    const items = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Body должен быть массивом'
      });
    }

    const materialEstimateId = items[0].material_estimate_id;
    const subsectionId = items[0].subsection_id;

    /* ================================
       1️⃣ СОБИРАЕМ ID
    ================================= */

    const materialIds = items
      .filter(i => i.item_type == 1)
      .map(i => i.material_id);

    const serviceIds = items
      .filter(i => i.item_type == 2)
      .map(i => i.service_id);

    /* ================================
       2️⃣ ОДИН SELECT
    ================================= */

    const existingItems = await MaterialEstimateItem.findAll({
      where: {
        material_estimate_id: materialEstimateId,
        subsection_id: subsectionId,
        deleted: false,
        [Op.or]: [
          { material_id: materialIds },
          { service_id: serviceIds }
        ]
      },
      transaction
    });

    /* ================================
       3️⃣ MAP ДЛЯ БЫСТРОГО ДОСТУПА
    ================================= */

    const existingMap = new Map();

    for (const item of existingItems) {

      const key = item.item_type == 1
        ? `m_${item.material_id}`
        : `s_${item.service_id}`;

      existingMap.set(key, item);

    }

    const newItems = [];
    const updatedItems = [];

    /* ================================
       4️⃣ ОБРАБОТКА
    ================================= */

    for (const item of items) {

      const key = item.item_type == 1
        ? `m_${item.material_id}`
        : `s_${item.service_id}`;

      const existing = existingMap.get(key);

      if (existing) {

        const newQuantity =
          Number(existing.quantity_planned || 0) +
          Number(item.quantity_planned || 0);

        await updateWithAudit({
          model: MaterialEstimateItem,
          id: existing.id,
          data: { quantity_planned: newQuantity },
          entityType: 'material_estimate_item',
          action: 'quantity_merged',
          userId: req.user.id,
          comment: `Добавлено ${item.quantity_planned}`,
          transaction
        });

        updatedItems.push({
          ...existing.toJSON(),
          quantity_planned: newQuantity
        });

      } else {

        newItems.push({
          ...item,
          material_id: item.item_type == 1 ? item.material_id : null,
          service_id: item.item_type == 2 ? item.service_id : null,
          coefficient: item.coefficient ?? null,
          created_user_id: req.user.id
        });

      }

    }

    /* ================================
       5️⃣ BULK INSERT
    ================================= */

    let created = [];

    if (newItems.length) {
      created = await MaterialEstimateItem.bulkCreate(newItems, {
        transaction
      });
    }

    await transaction.commit();

    /* ================================
       🔥 ОБЪЕДИНЯЕМ
    ================================= */

    const data = [
      ...created.map(i => i.toJSON()),
      ...updatedItems
    ];

    res.status(201).json({
      success: true,
      message: 'Позиции сметы обработаны',
      data
    });

  } catch (error) {

    await transaction.rollback();

    console.error('createMaterialEstimateItemsBulk error:', error);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
      error: error.message
    });

  }

};

const updateMaterialEstimateItem = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { comment, ...data } = req.body;

    const result = await updateWithAudit({
      model: MaterialEstimateItem,
      id,
      data,
      entityType: 'material_estimate_item',
      action: 'material_estimate_item_updated',
      userId: req.user.id,
      comment,
      transaction
    });

    if (result.notFound) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Позиция сметы не найдена'
      });
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Позиция сметы успешно обновлена',
      data: result.instance
    });

  } catch (error) {
    await transaction.rollback();
    console.error('updateMaterialEstimateItem error:', error);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении позиции сметы',
      error: error.message
    });
  }
};

const deleteMaterialEstimateItem = async (req, res) => {
  try {
    const { id } = req.params;

    const [updated] = await MaterialEstimateItem.update(
      { deleted: true },
      { where: { id } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Позиция сметы не найдена'
      });
    }

    res.json({
      success: true,
      message: 'Позиция сметы успешно удалена'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении позиции сметы',
      error: error.message
    });
  }
};

module.exports = {
  getAllMaterialEstimateItems,
  searchMaterialEstimateItems,
  getMaterialEstimateItemById,
  createMaterialEstimateItems,
  updateMaterialEstimateItem,
  deleteMaterialEstimateItem
};
