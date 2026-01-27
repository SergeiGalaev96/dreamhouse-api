const os = require('node:os');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Импорт маршрутов
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const userRolesRoutes = require('./routes/userRoleRoutes');

const projectRoutes = require('./routes/projectRoutes');
const projectTypeRoutes = require('./routes/projectTypeRoutes');
const projectStatusRoutes = require('./routes/projectStatusRoutes');
const projectStageRoutes = require('./routes/projectStageRoutes');
const projectStageStatusRoutes = require('./routes/projectStageStatusRoutes');
// Материалы
const materialRoutes = require('./routes/materialRoutes');
const materialTypeRoutes = require('./routes/materialTypeRoutes');
const unitOfMeasureRoutes = require('./routes/unitOfMeasureRoutes');
// Заявки на материалы
const materialRequestRoutes = require('./routes/materialRequestRoutes');
const materialRequestItemRoutes = require('./routes/materialRequestItemRoutes');
const materialRequestStatusRoutes = require('./routes/materialRequestStatusRoutes');
const materialRequestItemStatusRoutes = require('./routes/materialRequestItemStatusRoutes');
// Склады
const warehouseRoutes = require('./routes/warehouseRoutes');
const warehouseStockRoutes = require('./routes/warehouseStockRoutes');
// Транзакции материалов
const materialMovementRoutes = require('./routes/materialMovementRoutes');
const materialMovementStatusRoutes = require('./routes/materialMovementStatusRoutes');
// Заявки на закуп
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const purchaseOrderStatusRoutes = require('./routes/purchaseOrderStatusRoutes');
const purchaseOrderItemRoutes = require('./routes/purchaseOrderItemRoutes');
const purchaseOrderItemStatusRoutes = require('./routes/purchaseOrderItemStatusRoutes');
// Поставщики
const supplierRoutes = require('./routes/supplierRoutes');
// Валюты
const currencyRoutes = require('./routes/currencyRoutes');
const currencyRatesRoutes = require('./routes/currencyRatesRoutes');
const { startCurrencyCron, updateCurrencyRates } = require('./utils/currencyCron');



const contractRoutes = require('./routes/contractRoutes');
const contractorRoutes = require('./routes/contractorRoutes');
const documentRoutes = require('./routes/documentRoutes');

const workTeamRoutes = require('./routes/workTeamRoutes');
const teamMemberRoutes = require('./routes/teamMemberRoutes');

const app = express();

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(cors({
  origin: '*', // разрешить все источники (для локальной разработки)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const getLocalIp = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

const localIp = getLocalIp();
const SWAGGER_IP = process.env.IP || 'http://77.235.27.71';
const SWAGGER_PORT = process.env.PORT || 4000;

// Swagger конфигурация
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Dream House API',
      version: '1.0.0',
      description: 'API для системы управления строительными проектами "Dream House"'
    },
    servers: [
      {
        // url: `http://${localIp}:3300`, // Prod
        // url: `http://192.168.2.112:${SWAGGER_PORT}`, // Local
        url: `${SWAGGER_IP}:${SWAGGER_PORT}`, // Local => web
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Маршруты
// Аутентификация
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/userRoles', userRolesRoutes);
// Объекты
app.use('/api/projects', projectRoutes);
app.use('/api/projectTypes', projectTypeRoutes);
app.use('/api/projectStatuses', projectStatusRoutes);
app.use('/api/projectStages', projectStageRoutes);
app.use('/api/projectStageStatuses', projectStageStatusRoutes);
// Материалы
app.use('/api/materials', materialRoutes);
app.use('/api/materialTypes', materialTypeRoutes);
app.use('/api/unitsOfMeasure', unitOfMeasureRoutes);
// Заявки на материалы
app.use('/api/materialRequests', materialRequestRoutes);
app.use('/api/materialRequestStatuses', materialRequestStatusRoutes);
app.use('/api/materialRequestItems', materialRequestItemRoutes);
app.use('/api/materialRequestItemStatuses', materialRequestItemStatusRoutes);
// Заявки на закуп
app.use('/api/purchaseOrders', purchaseOrderRoutes);
app.use('/api/purchaseOrderStatuses', purchaseOrderStatusRoutes);
app.use('/api/purchaseOrderItems', purchaseOrderItemRoutes);
app.use('/api/purchaseOrderItemStatuses', purchaseOrderItemStatusRoutes);
// Поставщики
app.use('/api/suppliers', supplierRoutes);

// Валюты
app.use('/api/currencies', currencyRoutes);
app.use('/api/currencyRates', currencyRatesRoutes);
startCurrencyCron(); // атоматическое обновление курсов из НБКР
updateCurrencyRates();
// Склады
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/warehouseStocks', warehouseStockRoutes);
// Транзакции материалов
app.use('/api/materialMovements', materialMovementRoutes);
app.use('/api/materialMovementStatuses', materialMovementStatusRoutes);

// Контракты
app.use('/api/contracts', contractRoutes);
app.use('/api/contractors', contractorRoutes);
// Бригады
app.use('/api/workTeams', workTeamRoutes);
app.use('/api/teamMembers', teamMemberRoutes);
// Документы
app.use('/api/documents', documentRoutes);

// Обработка 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Маршрут не найден'
  });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Внутренняя ошибка сервера',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

module.exports = app;