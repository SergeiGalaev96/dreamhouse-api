const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendTempPasswordEmail } = require('../utils/mailer');

const getAllUsers = async (req, res) => {
  try {
    const whereClause = { deleted: false };

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['password_hash'] }
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
      message: 'Ошибка сервера при получении пользователей',
      error: error.message
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, middle_name, phone, role_id } = req.body;

    // Проверка существования пользователя
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь с таким именем или email уже существует'
      });
    }

    // Хеширование пароля
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Создание пользователя
    const user = await User.create({
      username,
      email,
      password_hash: hashedPassword,
      first_name,
      last_name,
      middle_name,
      phone,
      role_id
    });

    // Генерация JWT токена
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role_id: user.role_id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      message: 'Пользователь успешно зарегистрирован',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        middle_name: user.middle_name,
        phone: user.phone
      },
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при регистрации пользователя',
      error: error.message
    });
  }
};

const searchUsers = async (req, res) => {
  try {
    const {
      search,       // ← единая строка поиска
      role_id,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;

    const whereClause = { deleted: false };

    // Если есть общий search → ищем по всем полям
    if (search) {
      const s = `%${search}%`;

      whereClause[Op.or] = [
        { username: { [Op.iLike]: s } },
        { email: { [Op.iLike]: s } },
        { first_name: { [Op.iLike]: s } },
        { last_name: { [Op.iLike]: s } },
        { middle_name: { [Op.iLike]: s } },
        { phone: { [Op.iLike]: s } }
      ];
    }

    // Доп. фильтр если нужен
    if (role_id !== undefined) {
      whereClause.role_id = role_id;
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      limit: Number(size),
      offset: Number(offset),
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['password_hash'] }
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
    console.error('Ошибка при поиске пользователей:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при поиске пользователей',
      error: error.message
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении пользователя',
      error: error.message
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Удаляем поля, которые не должны обновляться
    delete updateData.id;
    delete updateData.password_hash;
    delete updateData.created_at;

    const [updated] = await User.update(updateData, {
      where: { id: id }
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password_hash'] }
    });

    res.json({
      success: true,
      message: 'Пользователь успешно обновлен',
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении пользователя',
      error: error.message
    });
  }
};

const generateTempPassword = () => {
  return crypto.randomBytes(6).toString('base64url');
};

const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Проверка обязательного email
    if (!user.email) {
      return res.status(400).json({
        success: false,
        message: 'У пользователя не указан email. Сброс пароля невозможен.'
      });
    }

    // const tempPassword = generateTempPassword();
    const tempPassword = "12345";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    await User.update(
      {
        password_hash: hashedPassword,
        required_action: 'RESET_PASSWORD'
      },
      { where: { id } }
    );

    // Отправка временного пароля
    await sendTempPasswordEmail(user.email, tempPassword);

    res.json({
      success: true,
      message: 'Временный пароль установлен. Пользователь должен сменить пароль.'
    });

  } catch (error) {
    console.error('resetPassword error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при сбросе пароля',
      error: error.message
    });
  }
};

const changeOwnPassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Необходимо указать старый и новый пароль",
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден"
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Старый пароль неверный",
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await User.update(
      { password_hash: newHash, required_action: null},
      { where: { id: userId } }
    );

    res.json({
      success: true,
      message: "Пароль успешно изменён"
    });

  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера"
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = Number(id);

    // Проверяем корректность id
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный ID пользователя'
      });
    }

    // Проверяем, что пользователь не пытается удалить самого себя
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Нельзя удалить собственный аккаунт'
      });
    }

    // Обновляем поле deleted вместо удаления записи
    const [updated] = await User.update(
      { deleted: true },
      { where: { id: userId } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    return res.json({
      success: true,
      message: 'Пользователь удалён'
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении пользователя',
      error: error.message
    });
  }
};


module.exports = {
  getAllUsers,
  createUser,
  searchUsers,
  getUserById,
  updateUser,
  resetPassword,
  changeOwnPassword,
  deleteUser
};