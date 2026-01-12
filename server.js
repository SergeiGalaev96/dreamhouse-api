const os = require('node:os');
const app = require('./src/app');
const sequelize = require('./src/config/database');
require('dotenv').config();

const PORT = process.env.PORT || 4000;

// Проверка подключения к базе данных
sequelize.authenticate()
  .then(() => {
    console.log('Подключение к базе данных успешно установлено');
    
    // Синхронизация моделей (только в development)
    if (process.env.NODE_ENV === 'development') {
      // sequelize.sync({ alter: true })
      //   .then(() => {
      //     console.log('Модели успешно синхронизированы');
      //   })
      //   .catch(err => {
      //     console.error('Ошибка синхронизации моделей:', err);
      //   });
    }
  })
  .catch(err => {
    console.error('Ошибка подключения к базе данных:', err);
    process.exit(1);
  });


// Запуск сервера
app.listen(PORT, '0.0.0.0',() => {
  console.log(`Сервер запущен на порту ${PORT}`);
});