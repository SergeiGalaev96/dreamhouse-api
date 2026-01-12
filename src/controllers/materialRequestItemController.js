const { Op } = require("sequelize");
const { MaterialRequestItem, MaterialRequest, PurchaseOrderItem } = require('../models');

const getAllMaterialRequestItems = async (req, res) => {
  try {
    const whereClause = { deleted: false };
    const { count, rows } = await MaterialRequestItem.findAndCountAll({
      where: whereClause,
      order: [['material_request_id', 'ASC']],
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при поиске материалов в заявках',
      error: error.message
    });
  }
};

const searchMaterialRequestItems = async (req, res) => {
  try {
    const {
      material_request_id,
      material_type,
      material_id,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;

    const whereClause = { deleted: false };

    if (material_request_id) whereClause.material_request_id = material_request_id;
    if (material_type) whereClause.material_type = material_type;
    if (material_id) whereClause.material_id = material_id;

    const { count, rows } = await MaterialRequestItem.findAndCountAll({
      where: whereClause,
      limit: Number(size),
      offset: Number(offset),
      order: [['created_at', 'DESC']],
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
    console.error('Ошибка сервера при поиске материалов в заявках:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при поиске материалов в заявках',
      error: error.message
    });
  }
};

const searchMaterialsForPurchasingAgent = async (req, res) => {
  try {
    const {
      material_type,
      material_id,
      project_id,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;

    const whereClause = { deleted: false };
    if (material_type) whereClause.material_type = material_type;
    if (material_id) whereClause.material_id = material_id;

    // Фильтр по project_id через связанный MaterialRequest
    const include = [
      {
        model: MaterialRequest,
        as: 'material_request',
        where: {
          status: {
            [Op.notIn]: [1, 5] // Исключитьь статус 1) На одобрении, 5) Отменено
          },
          deleted: false,
          ...(project_id && { project_id })
        },
        attributes: [] // только для фильтрации
      }
    ];

    // Получаем материалы из заявок с пагинацией
    const { count, rows } = await MaterialRequestItem.findAndCountAll({
      distinct: true,
      where: whereClause,
      include,
      limit: Number(size),
      offset: Number(offset),
      order: [['status', 'ASC']],
    });

    // Получаем список id для подсчета заказанного
    const requestItemIds = rows.map(item => item.id);

    // Считаем общее количество уже заказанного по каждому material_request_item_id
    const orderedQuantities = await PurchaseOrderItem.findAll({
      attributes: [
        'material_request_item_id',
        [PurchaseOrderItem.sequelize.fn('SUM', PurchaseOrderItem.sequelize.col('quantity')), 'total_ordered']
      ],
      where: {
        material_request_item_id: { [Op.in]: requestItemIds },
        deleted: false
      },
      group: ['material_request_item_id']
    });

    const orderedMap = {};
    orderedQuantities.forEach(o => {
      orderedMap[o.material_request_item_id] = Number(o.get('total_ordered'));
    });

    // Формируем финальный результат с total_ordered и remaining_quantity
    const dataWithOrders = rows.map(item => {
      const totalOrdered = orderedMap[item.id] || 0;
      const remainingQuantity = Math.max(item.quantity - totalOrdered, 0);
      return {
        ...item.toJSON(),
        total_ordered: totalOrdered,
        remaining_quantity: remainingQuantity
      };
    });

    // Отдаем результат
    res.json({
      success: true,
      data: dataWithOrders,
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
    console.error('Ошибка сервера при поиске материалов для снабженца:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при поиске материалов для снабженца',
      error: error.message
    });
  }
};

const getMaterialRequestItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const materialRequestItem = await MaterialRequestItem.findByPk(id);

    if (!materialRequestItem) {
      return res.status(404).json({
        success: false,
        message: 'Материал в заявке не найден'
      });
    }

    res.json({
      success: true,
      data: materialRequestItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении материал в заявке',
      error: error.message
    });
  }
};

const createMaterialRequestItem = async (req, res) => {
  try {
    const materialRequestItem = await MaterialRequestItem.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Материал успешно добавлен в заявку',
      data: materialRequestItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при добавлении материала в заявку',
      error: error.message
    });
  }
};

const updateMaterialRequestItem = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await MaterialRequestItem.update(req.body, {
      where: { id: id }
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Материал в заявке не найден'
      });
    }

    const updatedMaterialRequestItem = await MaterialRequestItem.findByPk(id);

    res.json({
      success: true,
      message: 'Материал в заявке успешно обновлен',
      data: updatedMaterialRequestItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении материала в заявке',
      error: error.message
    });
  }
};

const deleteMaterialRequestItem = async (req, res) => {
  try {
    const { id } = req.params;
    const materiaId = Number(id);

    // Обновляем поле deleted вместо удаления записи
    const [updated] = await MaterialRequestItem.update(
      { deleted: true },
      { where: { id: materiaId } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Материал в заявке не найден'
      });
    }

    return res.json({
      success: true,
      message: 'Материал успешно удален из заявки'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении материала из заявки',
      error: error.message
    });
  }
};

module.exports = {
  getAllMaterialRequestItems,
  searchMaterialRequestItems,
  searchMaterialsForPurchasingAgent,
  getMaterialRequestItemById,
  createMaterialRequestItem,
  updateMaterialRequestItem,
  deleteMaterialRequestItem
};