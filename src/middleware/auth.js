const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Если токена нет
  if (!token) {
    if (isDev) {
      req.user = { id: 6, role_id: 1 }; // фейковый пользователь
      return next();
    }

    return res.status(401).json({
      success: false,
      message: 'Токен доступа не предоставлен'
    });
  }

  // Проверка токена
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err || !user) {
      if (isDev) {
        req.user = { id: 6, role_id: 1 }; // fallback для девелопмента
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Недействительный токен'
      });
    }

    // Защита от отсутствующего role_id
    if (!user.role_id) {
      console.warn("⚠️ Внимание: токен не содержит role_id. Добавьте его в JWT.");
    }

    req.user = user;
    next();
  });
};

const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role_id;

    if (!userRole) {
      return res.status(403).json({
        success: false,
        message: 'Роль пользователя не определена'
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Недостаточно прав для выполнения операции'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRole
};