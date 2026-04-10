const sequelize = require('../config/database');

const getAllMaterialWriteOffStatuses = async (req, res) => {
  try {
    const [rows] = await sequelize.query(`
      select id, name
      from construction.material_write_off_statuses
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
      message: 'Ошибка сервера при получении статусов списания',
      error: error.message
    });
  }
};

module.exports = {
  getAllMaterialWriteOffStatuses,
};
