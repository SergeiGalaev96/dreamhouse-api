const sequelize = require('../config/database');

const getAllWarehouseTransferStatuses = async (req, res) => {
  try {
    const [rows] = await sequelize.query(`
      select id, name
      from construction.warehouse_transfer_statuses
      where deleted = false or deleted is null
      order by id asc
    `);

    return res.json({
      success: true,
      data: rows,
      pagination: {
        total: rows.length
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении статусов перемещений',
      error: error.message
    });
  }
};

module.exports = {
  getAllWarehouseTransferStatuses
};
