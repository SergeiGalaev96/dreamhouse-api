const { Sequelize } = require("sequelize");
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
      page = 1,
      size = 20
    } = req.body;

    const offset = (page - 1) * size;

    const rows = await sequelize.query(
      `
  SELECT
    mei.*,

    COALESCE(SUM(mri.quantity),0) AS requested,

    (mei.quantity_planned -
     COALESCE(SUM(mri.quantity),0)) AS remaining,

    COUNT(*) OVER() AS total_count

  FROM construction.material_estimate_items mei

  JOIN construction.material_estimates me
    ON me.id = mei.material_estimate_id
    AND me.deleted = false

  JOIN construction.project_blocks pb
    ON pb.id = me.block_id
    AND pb.deleted = false

  LEFT JOIN construction.material_request_items mri
    ON mri.material_estimate_item_id = mei.id
    AND mri.deleted = false

  WHERE mei.deleted = false
  ${item_type ? "AND mei.item_type = :item_type" : ""}
  ${project_id ? "AND pb.project_id = :project_id" : ""}
  ${block_id ? "AND pb.id = :block_id" : ""}

  GROUP BY mei.id

  HAVING
  (mei.quantity_planned -
   COALESCE(SUM(mri.quantity),0)) > 0

  ORDER BY mei.id

  LIMIT :size OFFSET :offset
  `,
      {
        replacements: {
          project_id,
          block_id,
          item_type,
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

const createMaterialEstimateItem = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {

    const {
      item_type,
      material_id,
      service_id,
      quantity_planned
    } = req.body;

    /* ================================
       1️⃣ ВАЛИДАЦИЯ
    ================================= */

    if (![1, 2].includes(Number(item_type))) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Неверный item_type (1=material, 2=service)'
      });
    }

    if (item_type == 1 && (!material_id || service_id)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Для материала нужен material_id'
      });
    }

    if (item_type == 2 && (!service_id || material_id)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Для услуги нужен service_id'
      });
    }

    /* ================================
       2️⃣ ПОИСК ДУБЛЯ
    ================================= */

    const whereClause = {
      material_estimate_id: req.body.material_estimate_id,
      subsection_id: req.body.subsection_id,
      item_type,
      deleted: false,
      ...(item_type == 1
        ? { material_id }
        : { service_id })
    };

    const existingItem = await MaterialEstimateItem.findOne({
      where: whereClause,
      transaction
    });

    /* ================================
       3️⃣ СЛИЯНИЕ КОЛИЧЕСТВА
    ================================= */

    if (existingItem) {

      const oldQuantity = Number(existingItem.quantity_planned || 0);
      const addQuantity = Number(quantity_planned || 0);
      const newQuantity = oldQuantity + addQuantity;

      const result = await updateWithAudit({
        model: MaterialEstimateItem,
        id: existingItem.id,
        data: {
          quantity_planned: newQuantity
        },
        entityType: 'material_estimate_item',
        action: 'quantity_merged',
        userId: req.user.id,
        comment: `Добавлено ${addQuantity}, было ${oldQuantity}`,
        transaction
      });

      await transaction.commit();

      return res.json({
        success: true,
        message: 'Количество увеличено в существующей позиции',
        data: result.instance
      });

    }

    /* ================================
       4️⃣ НОРМАЛИЗАЦИЯ ДАННЫХ
    ================================= */

    const payload = {
      ...req.body,

      material_id: item_type == 1 ? material_id : null,
      service_id: item_type == 2 ? service_id : null,

      coefficient: req.body.coefficient ?? null,
      created_user_id: req.user.id
    };

    /* ================================
       5️⃣ СОЗДАНИЕ
    ================================= */

    const item = await MaterialEstimateItem.create(payload, { transaction });

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: 'Позиция сметы создана',
      data: item
    });

  } catch (error) {

    await transaction.rollback();

    console.error('createMaterialEstimateItem error:', error);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании позиции',
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
  createMaterialEstimateItem,
  updateMaterialEstimateItem,
  deleteMaterialEstimateItem
};
