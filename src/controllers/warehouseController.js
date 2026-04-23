const { Op, QueryTypes } = require("sequelize");
const { sequelize, Warehouse, WarehouseStock } = require('../models');
const updateWithAudit = require('../utils/updateWithAudit');

const countByWarehouse = async (sql, warehouseIds) => {
  if (!warehouseIds.length) return new Map();

  const rows = await sequelize.query(sql, {
    replacements: { warehouseIds },
    type: QueryTypes.SELECT
  });

  return new Map(rows.map((row) => [Number(row.warehouse_id), Number(row.total || 0)]));
};

const movementOperationCountsByWarehouse = async (warehouseIds) => {
  if (!warehouseIds.length) return new Map();

  const rows = await sequelize.query(
    `
      select warehouse_id, operation, count(*)::int as total
      from (
        select from_warehouse_id as warehouse_id, operation
        from construction.material_movements
        where from_warehouse_id in (:warehouseIds)
          and (deleted = false or deleted is null)
        union all
        select to_warehouse_id as warehouse_id, operation
        from construction.material_movements
        where to_warehouse_id in (:warehouseIds)
          and (deleted = false or deleted is null)
      ) movement_rows
      where warehouse_id is not null
      group by warehouse_id, operation
    `,
    {
      replacements: { warehouseIds },
      type: QueryTypes.SELECT
    }
  );

  const counts = new Map();

  for (const row of rows) {
    const warehouseId = Number(row.warehouse_id);
    const operation = row.operation;
    const total = Number(row.total || 0);

    if (!counts.has(warehouseId)) {
      counts.set(warehouseId, {
        incoming: 0,
        outgoing: 0,
        transfer: 0,
        '+': 0,
        '-': 0,
        '=': 0
      });
    }

    const warehouseCounts = counts.get(warehouseId);
    warehouseCounts[operation] = total;
    if (operation === '+') warehouseCounts.incoming = total;
    if (operation === '-') warehouseCounts.outgoing = total;
    if (operation === '=') warehouseCounts.transfer = total;
  }

  return counts;
};


const getAllWarehouses = async (req, res) => {
  try {
    // const { page = 1, size = 10} = req.query;
    // const offset = (page - 1) * size;

    const whereClause = { deleted: false };

    const { count, rows } = await Warehouse.findAndCountAll({
      where: whereClause,
      // size: parseInt(size),
      // offset: parseInt(offset),
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        // page: parseInt(page),
        // size: parseInt(size),
        total: count,
        // pages: Math.ceil(count / size)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении складов',
      error: error.message
    });
  }
};

const searchWarehouses = async (req, res) => {
  try {

    const {
      project_id,
      manager_id,
      name,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;

    const whereClause = { deleted: false };

    if (project_id)
      whereClause.project_id = project_id;

    if (manager_id)
      whereClause.manager_id = manager_id;

    if (name)
      whereClause.name = { [Op.iLike]: `%${name}%` };

    const { count, rows } = await Warehouse.findAndCountAll({
      where: whereClause,

      distinct: true,

      limit: Number(size),
      offset: Number(offset),

      order: [['created_at', 'DESC']],

      include: [
        {
          model: WarehouseStock,
          as: 'items',
          required: false,
          where: {
            deleted: false
          }
        }
      ]
    });

    const warehouseIds = rows.map((warehouse) => Number(warehouse.id));
    const [
      materialRecordCounts,
      avrWriteOffCounts,
      mbpWriteOffCounts,
      processingWriteOffCounts,
      transferCounts,
      movementOperationCounts
    ] = await Promise.all([
      countByWarehouse(
        `
          select warehouse_id, count(*)::int as total
          from construction.warehouse_stock
          where warehouse_id in (:warehouseIds)
            and (deleted = false or deleted is null)
          group by warehouse_id
        `,
        warehouseIds
      ),
      countByWarehouse(
        `
          select warehouse_id, count(*)::int as total
          from construction.material_write_offs
          where warehouse_id in (:warehouseIds)
            and (deleted = false or deleted is null)
          group by warehouse_id
        `,
        warehouseIds
      ),
      countByWarehouse(
        `
          select warehouse_id, count(*)::int as total
          from construction.mbp_write_offs
          where warehouse_id in (:warehouseIds)
            and (deleted = false or deleted is null)
          group by warehouse_id
        `,
        warehouseIds
      ),
      countByWarehouse(
        `
          select warehouse_id, count(*)::int as total
          from construction.material_processing_write_offs
          where warehouse_id in (:warehouseIds)
            and (deleted = false or deleted is null)
          group by warehouse_id
        `,
        warehouseIds
      ),
      countByWarehouse(
        `
          select warehouse_id, count(*)::int as total
          from (
            select from_warehouse_id as warehouse_id
            from construction.warehouse_transfers
            where from_warehouse_id in (:warehouseIds)
              and (deleted = false or deleted is null)
            union all
            select to_warehouse_id as warehouse_id
            from construction.warehouse_transfers
            where to_warehouse_id in (:warehouseIds)
              and (deleted = false or deleted is null)
          ) transfer_rows
          group by warehouse_id
        `,
        warehouseIds
      ),
      movementOperationCountsByWarehouse(warehouseIds)
    ]);

    const enrichedRows = rows.map((warehouse) => {
      const data = warehouse.toJSON();
      const warehouseId = Number(data.id);

      return {
        ...data,
        material_records_count: materialRecordCounts.get(warehouseId) || 0,
        avr_write_off_count: avrWriteOffCounts.get(warehouseId) || 0,
        mbp_write_off_count: mbpWriteOffCounts.get(warehouseId) || 0,
        processing_write_off_count: processingWriteOffCounts.get(warehouseId) || 0,
        transfer_count: transferCounts.get(warehouseId) || 0,
        operation_counts: movementOperationCounts.get(warehouseId) || {
          incoming: 0,
          outgoing: 0,
          transfer: 0,
          '+': 0,
          '-': 0,
          '=': 0
        }
      };
    });

    res.json({
      success: true,
      data: enrichedRows,
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

    console.error("Ошибка при поиске запасов:", error);

    res.status(500).json({
      success: false,
      message: "Ошибка сервера при поиске запасов",
      error: error.message,
    });

  }
};

const getWarehouseById = async (req, res) => {
  try {
    const { id } = req.params;
    const warehouse = await Warehouse.findByPk(id);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Склад не найден'
      });
    }

    res.json({
      success: true,
      data: warehouse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении склада',
      error: error.message
    });
  }
};

const createWarehouse = async (req, res) => {
  try {
    const existingWarehouse = await Warehouse.findOne({
      where: {
        project_id: req.body.project_id,
        deleted: false
      }
    });

    if (existingWarehouse) {
      return res.status(400).json({
        success: false,
        message: 'Для проекта уже существует активный склад'
      });
    }

    const warehouse = await Warehouse.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Склад успешно создан',
      data: warehouse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании склада',
      error: error.message
    });
  }
};

const updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, ...data } = req.body;

    const result = await updateWithAudit({
      model: Warehouse,
      id,
      data,
      entityType: 'warehouse',
      action: 'warehouse_updated',
      userId: req.user.id,
      comment
    });

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: 'Склад не найден'
      });
    }

    return res.json({
      success: true,
      message: result.changed
        ? 'Склад успешно обновлён'
        : 'Изменений не обнаружено',
      data: result.instance
    });

  } catch (error) {
    console.error('updateWarehouse error:', error);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении склада',
      error: error.message
    });
  }
};


const deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Warehouse.destroy({
      where: { id: id }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Склад не найден'
      });
    }

    res.json({
      success: true,
      message: 'Склад успешно удален'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении склада',
      error: error.message
    });
  }
};

module.exports = {
  getAllWarehouses,
  searchWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse
};
