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
      material_estimate_id,
      subsection_id,
      item_type,          // 1 = material, 2 = service
      material_type,
      material_id,
      service_type,
      service_id,
      unit_of_measure,
      quantity_planned,
      coefficient,
      currency,
      price,
      comment
    } = req.body;

    /* ================================
       1️⃣ ВАЛИДАЦИЯ ТИПА
    ================================== */

    if (!item_type || ![1, 2].includes(Number(item_type))) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Неверный item_type (1=material, 2=service)'
      });
    }

    if (item_type == 1) {
      if (!material_id || service_id) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Для материала должен быть material_id и не должен быть service_id'
        });
      }
    }

    if (item_type == 2) {
      if (!service_id || material_id) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Для услуги должен быть service_id и не должен быть material_id'
        });
      }
    }

    /* ================================
       2️⃣ ПОИСК СУЩЕСТВУЮЩЕЙ ПОЗИЦИИ
    ================================== */

    const whereClause = {
      material_estimate_id,
      subsection_id,
      item_type,
      deleted: false
    };

    if (item_type == 1) {
      whereClause.material_id = material_id;
    } else {
      whereClause.service_id = service_id;
    }

    const existingItem = await MaterialEstimateItem.findOne({
      where: whereClause,
      transaction
    });

    /* ================================
       3️⃣ ЕСЛИ НАШЛИ — СКЛАДЫВАЕМ
    ================================== */

    if (existingItem) {
      const oldQuantity = Number(existingItem.quantity_planned || 0);
      const addQuantity = Number(quantity_planned || 0);
      const newQuantity = oldQuantity + addQuantity;

      const result = await updateWithAudit({
        model: MaterialEstimateItem,
        id: existingItem.id,
        data: {
          quantity_planned: newQuantity,
          ...(comment ? { comment } : {})
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
       4️⃣ ИНАЧЕ СОЗДАЁМ НОВУЮ
    ================================== */

    const item = await MaterialEstimateItem.create({
      material_estimate_id,
      subsection_id,
      item_type,
      material_type,
      material_id: item_type == 1 ? material_id : null,
      service_type,
      service_id: item_type == 2 ? service_id : null,
      unit_of_measure,
      quantity_planned,
      coefficient: coefficient ?? null,
      currency,
      price,
      comment,
      created_user_id: req.user.id
    }, { transaction });

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
  getMaterialEstimateItemById,
  createMaterialEstimateItem,
  updateMaterialEstimateItem,
  deleteMaterialEstimateItem
};
