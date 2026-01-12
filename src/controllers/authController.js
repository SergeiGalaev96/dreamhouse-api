const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');
require('dotenv').config();

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Поиск пользователя
    const user = await User.findOne({
      where: {
        username: username
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Неверное имя пользователя или пароль'
      });
    }

    // Проверка пароля
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Неверное имя пользователя или пароль'
      });
    }

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

    res.json({
      success: true,
      message: 'Успешная авторизация',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role_id: user.role_id,
        required_action: user.required_action
      },
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при авторизации',
      error: error.message
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
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
      message: 'Ошибка сервера при получении профиля',
      error: error.message
    });
  }
};

module.exports = {
  login,
  getProfile
};