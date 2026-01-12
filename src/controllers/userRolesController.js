const UserRole = require('../models/UserRole');

const getUserRoles = async (req, res) => {
  try {
    // const { page = 1, size = 10, role_id } = req.query;
    // const offset = (page - 1) * size;

    const whereClause = { deleted: false };

    const { count, rows } = await UserRole.findAndCountAll({
      where: whereClause,
      // size: parseInt(size),
      // offset: parseInt(offset),
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
      message: 'Ошибка сервера при ролей пользователей',
      error: error.message
    });
  }
};

module.exports = {
  getUserRoles,
};