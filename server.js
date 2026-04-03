const os = require('node:os');
require('dotenv').config();

const app = require('./src/app');
const sequelize = require('./src/config/database');
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

// 👇 подключаем сокеты
require('./socket')(io);

const PORT = process.env.PORT || 4000;

/* =========================
   DB
========================= */

sequelize.authenticate()
  .then(() => {
    console.log('Подключение к базе данных успешно установлено');
  })
  .catch(err => {
    console.error('Ошибка подключения к базе данных:', err);
    process.exit(1);
  });

/* =========================
   START SERVER
========================= */

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server + Socket запущен на порту ${PORT}`);
});