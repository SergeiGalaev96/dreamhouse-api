const { Op } = require('sequelize');
const {
  WarehouseTransferItem,
  WarehouseTransfer,
  Material
} = require('../models');

const searchWarehouseTransferItems = async (req, res) => {
  try {
    const {
      warehouse_transfer_id,
      material_id,
      page = 1,
      size = 10
    } = req.body || {};

    const where = { deleted: false };

    if (warehouse_transfer_id) {
      where.warehouse_transfer_id = Number(warehouse_transfer_id);
    }

    if (material_id) {
      where.material_id = Number(material_id);
    }

    const normalizedPage = Math.max(Number(page) || 1, 1);
    const normalizedSize = Math.max(Number(size) || 10, 1);
    const offset = (normalizedPage - 1) * normalizedSize;

    const { count, rows } = await WarehouseTransferItem.findAndCountAll({
      where,
      include: [
        {
          model: WarehouseTransfer,
          as: 'transfer',
          where: { deleted: false },
          required: false
        },
        {
          model: Material,
          as: 'material',
          required: false
        }
      ],
      limit: normalizedSize,
      offset,
      order: [['id', 'DESC']]
    });

    return res.json({
      success: true,
      data: rows,
      pagination: {
        page: normalizedPage,
        size: normalizedSize,
        total: count,
        pages: Math.ceil(count / normalizedSize),
        hasNext: normalizedPage * normalizedSize < count,
        hasPrev: normalizedPage > 1
      }
    });
  } catch (error) {
    console.error('searchWarehouseTransferItems error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при поиске позиций накладных перемещения',
      error: error.message
    });
  }
};

const getWarehouseTransferItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await WarehouseTransferItem.findOne({
      where: {
        id: Number(id),
        deleted: false
      },
      include: [
        {
          model: WarehouseTransfer,
          as: 'transfer',
          where: { deleted: false },
          required: false
        },
        {
          model: Material,
          as: 'material',
          required: false
        }
      ]
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Позиция накладной перемещения не найдена'
      });
    }

    return res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('getWarehouseTransferItemById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении позиции накладной перемещения',
      error: error.message
    });
  }
};

module.exports = {
  searchWarehouseTransferItems,
  getWarehouseTransferItemById
};
