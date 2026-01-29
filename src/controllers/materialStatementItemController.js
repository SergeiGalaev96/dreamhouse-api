const {
  sequelize,
  MaterialStatementItem
} = require('../models');

const updateWithAudit = require('../utils/updateWithAudit');

const getAllMaterialStatementItems = async (req, res) => {
  try {
    const { count, rows } = await MaterialStatementItem.findAndCountAll({
      where: { deleted: false },
      distinct: true,
      col: 'id',
      order: [['material_statement_id', 'ASC']]
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
      message: 'Ошибка сервера при получении позиций ведомости',
      error: error.message
    });
  }
};

const getMaterialStatementItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await MaterialStatementItem.findOne({
      where: {
        id,
        deleted: false
      }
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Позиция ведомости не найдена'
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении позиции ведомости',
      error: error.message
    });
  }
};

const createMaterialStatementItem = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      material_statement_id,
      material_type,
      material_id,
      unit_of_measure,
      quantity_planned,
      comment
    } = req.body;

    /* ============================================================
       1️⃣ Ищем существующую позицию в этой ведомости
    ============================================================ */
    const existingItem = await MaterialStatementItem.findOne({
      where: {
        material_statement_id,
        material_id,
        deleted: false
      },
      transaction
    });

    /* ============================================================
   2️⃣ ЕСЛИ НАШЛИ — увеличиваем количество (через AUDIT)
============================================================ */
    if (existingItem) {
      const oldQuantity = Number(existingItem.quantity_planned || 0);
      const addQuantity = Number(quantity_planned || 0);
      const newQuantity = oldQuantity + addQuantity;

      const result = await updateWithAudit({
        model: MaterialStatementItem,
        id: existingItem.id,
        data: {
          quantity_planned: newQuantity,
          ...(comment ? { comment } : {})
        },
        entityType: 'material_statement_item',
        action: 'quantity_merged',
        userId: req.user.id,
        comment: `Добавлено ${addQuantity}, было ${oldQuantity}`,
        transaction
      });

      await transaction.commit();

      return res.json({
        success: true,
        message: 'Количество материала увеличено в существующей позиции',
        data: result.instance
      });
    }


    /* ============================================================
       3️⃣ ЕСЛИ НЕТ — создаём новую позицию
    ============================================================ */
    const item = await MaterialStatementItem.create(
      {
        material_statement_id,
        material_id,
        material_type,
        unit_of_measure,
        quantity_planned,
        comment,
        created_user_id: req.user.id
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: 'Позиция ведомости успешно создана',
      data: item
    });

  } catch (error) {
    await transaction.rollback();
    console.error('createMaterialStatementItem error:', error);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании позиции ведомости',
      error: error.message
    });
  }
};


const updateMaterialStatementItem = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { comment, ...data } = req.body;

    const result = await updateWithAudit({
      model: MaterialStatementItem,
      id,
      data,
      entityType: 'material_statement_item',
      action: 'material_statement_item_updated',
      userId: req.user.id,
      comment,
      transaction
    });

    if (result.notFound) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Позиция ведомости не найдена'
      });
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Позиция ведомости успешно обновлена',
      data: result.instance
    });

  } catch (error) {
    await transaction.rollback();
    console.error('updateMaterialStatementItem error:', error);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении позиции ведомости',
      error: error.message
    });
  }
};

const deleteMaterialStatementItem = async (req, res) => {
  try {
    const { id } = req.params;

    const [updated] = await MaterialStatementItem.update(
      { deleted: true },
      { where: { id } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Позиция ведомости не найдена'
      });
    }

    res.json({
      success: true,
      message: 'Позиция ведомости успешно удалена'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении позиции ведомости',
      error: error.message
    });
  }
};

module.exports = {
  getAllMaterialStatementItems,
  getMaterialStatementItemById,
  createMaterialStatementItem,
  updateMaterialStatementItem,
  deleteMaterialStatementItem
};
