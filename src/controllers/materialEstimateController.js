const { Op, fn, col, literal } = require('sequelize');
const {
  sequelize,
  MaterialEstimate,
  MaterialEstimateItem
} = require('../models');

const updateWithAudit = require('../utils/updateWithAudit');

const getAllMaterialEstimates = async (req, res) => {
  try {
    const whereClause = { deleted: false };

    const { count, rows } = await MaterialEstimate.findAndCountAll({
      where: whereClause,
      distinct: true,
      col: 'id',
      order: [['block_id', 'ASC']],
      include: [
        {
          model: MaterialEstimateItem,
          as: 'items',
          required: false,
          where: { deleted: false }
        }
      ]
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
      message: 'Ошибка сервера при получении смет',
      error: error.message
    });
  }
};

const searchMaterialEstimates = async (req, res) => {
  try {
    const {
      block_id,
      status,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;
    const whereClause = { deleted: false };

    if (block_id) whereClause.block_id = block_id;
    if (status) whereClause.status = status;

    const { count, rows } = await MaterialEstimate.findAndCountAll({
      where: whereClause,
      distinct: true,
      col: 'id',
      limit: Number(size),
      offset: Number(offset),
      order: [
        ['created_at', 'DESC'],
        [{ model: MaterialEstimateItem, as: 'items' }, 'item_type', 'ASC']
      ],
      include: [
        {
          model: MaterialEstimateItem,
          as: 'items',
          where: { deleted: false },
          required: false
        }
      ]
    });

    /* ============================================
       🔹 Подсчёт сумм по каждой смете
    ============================================ */

    const result = rows.map(estimate => {
      const plain = estimate.toJSON();

      let total_price_material = 0;
      let total_price_service = 0;
      let total_price = 0;

      if (plain.items && plain.items.length > 0) {
        for (const item of plain.items) {
          const qty = Number(item.quantity_planned || 0);
          const price = Number(item.price || 0);
          const coefficient = Number(item.coefficient || 1);

          total_price += qty * price * coefficient;

          if (item.item_type === 1) { // material
            total_price_material += qty * price * coefficient;
          }

          if (item.item_type === 2) { // service
            total_price_service += qty * price * coefficient;
          }
        }
      }

      return {
        ...plain,
        total_price_material,
        total_price_service,
        total_price
      };
    });

    /* ============================================ */

    res.json({
      success: true,
      data: result,
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
    console.error('Ошибка поиска смет:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при поиске смет',
      error: error.message
    });
  }
};

const getMaterialEstimateById = async (req, res) => {
  try {
    const { id } = req.params;

    const estimate = await MaterialEstimate.findOne({
      where: { id, deleted: false },
      include: [
        {
          model: MaterialEstimateItem,
          as: 'items'
        }
      ]
    });

    if (!estimate) {
      return res.status(404).json({
        success: false,
        message: 'Смета не найдена'
      });
    }

    res.json({
      success: true,
      data: estimate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении сметы',
      error: error.message
    });
  }
};

const createMaterialEstimate = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { items, ...estimateData } = req.body;

    /* ===============================
       1️⃣ Создаём саму смету
    =============================== */

    const estimate = await MaterialEstimate.create(
      {
        ...estimateData,
        created_user_id: req.user.id,
        deleted: false
      },
      { transaction }
    );

    /* ===============================
       2️⃣ Если items есть — создаём
    =============================== */

    if (items && Array.isArray(items) && items.length > 0) {
      const preparedItems = items.map(item => ({
        ...item,
        material_estimate_id: estimate.id,
        created_user_id: req.user.id,
        deleted: false
      }));

      await MaterialEstimateItem.bulkCreate(
        preparedItems,
        { transaction }
      );
    }

    /* ===============================
       3️⃣ Фиксируем транзакцию
    =============================== */

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Смета материалов успешно создана',
      data: estimate
    });

  } catch (error) {
    await transaction.rollback();
    console.error('createMaterialEstimate error:', error);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании сметы',
      error: error.message
    });
  }
};

const updateMaterialEstimate = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { comment, ...data } = req.body;

    const result = await updateWithAudit({
      model: MaterialEstimate,
      id,
      data,
      entityType: 'material_estimate',
      action: 'material_estimate_updated',
      userId: req.user.id,
      comment,
      transaction
    });

    if (result.notFound) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Смета не найдена'
      });
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Смета успешно обновлена',
      data: result.instance
    });

  } catch (error) {
    await transaction.rollback();
    console.error('updateMaterialEstimate error:', error);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении сметы',
      error: error.message
    });
  }
};

const deleteMaterialEstimate = async (req, res) => {
  try {
    const { id } = req.params;

    const [updated] = await MaterialEstimate.update(
      { deleted: true },
      { where: { id } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Смета не найдена'
      });
    }

    res.json({
      success: true,
      message: 'Смета успешно удалена'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении сметы',
      error: error.message
    });
  }
};

module.exports = {
  getAllMaterialEstimates,
  searchMaterialEstimates,
  getMaterialEstimateById,
  createMaterialEstimate,
  updateMaterialEstimate,
  deleteMaterialEstimate
};
