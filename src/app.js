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
const userRoleRoutes = require('./routes/userRoleRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
// Объекты
const projectRoutes = require('./routes/projectRoutes');
const projectTypeRoutes = require('./routes/projectTypeRoutes');
const projectStatusRoutes = require('./routes/projectStatusRoutes');
const projectStageRoutes = require('./routes/projectStageRoutes');
const projectStageStatusRoutes = require('./routes/projectStageStatusRoutes');
// Блоки объекта
const projectBlockRoutes = require('./routes/projectBlockRoutes');
// Этапы блока
const blockStageRoutes = require('./routes/blockStageRoutes');
// Подэтапы этапа
const stageSubsectionRoutes = require('./routes/stageSubsectionRoutes');

// Задачи
const taskRoutes = require('./routes/taskRoutes');
const taskStatusRoutes = require('./routes/taskStatusRoutes');
const taskPriorityRoutes = require('./routes/taskPriorityRoutes');
const startTaskDeadlineNotifierCron = require('./utils/taskDeadlineCron');

// Материалы
const materialRoutes = require('./routes/materialRoutes');
const materialTypeRoutes = require('./routes/materialTypeRoutes');
const unitOfMeasureRoutes = require('./routes/unitOfMeasureRoutes');
// Услуги
const serviceRoutes = require('./routes/serviceRoutes');
const serviceTypeRoutes = require('./routes/serviceTypeRoutes');
// Смета материалов
const materialEstimateRoutes = require('./routes/materialEstimateRoutes');
const materialEstimateItemRoutes = require('./routes/materialEstimateItemRoutes');
const materialEstimateItemTypeRoutes = require('./routes/materialEstimateItemTypeRoutes');

// Акты выполненных работ
const workPerformedRoutes = require('./routes/workPerformedRoutes');
const workPerformedItemRoutes = require('./routes/workPerformedItemRoutes');
const workPerformedItemTypeRoutes = require('./routes/workPerformedItemTypeRoutes');

// Заявки на материалы
const materialRequestRoutes = require('./routes/materialRequestRoutes');
const materialRequestItemRoutes = require('./routes/materialRequestItemRoutes');
const materialRequestStatusRoutes = require('./routes/materialRequestStatusRoutes');
const materialRequestItemStatusRoutes = require('./routes/materialRequestItemStatusRoutes');
const materialRequestItemTypeRoutes = require('./routes/materialRequestItemTypeRoutes');

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
const supplierRatingRoutes = require('./routes/supplierRatingRoutes');
// Валюты
const currencyRoutes = require('./routes/currencyRoutes');
const currencyRatesRoutes = require('./routes/currencyRatesRoutes');
const { startCurrencyCron, updateCurrencyRates } = require('./utils/currencyCron');

const contractRoutes = require('./routes/contractRoutes');
const contractorRoutes = require('./routes/contractorRoutes');

// Документы
const documentRoutes = require('./routes/documentRoutes');
const documentStageRoutes = require('./routes/documentStageRoutes');
const documentStatusRoutes = require('./routes/documentStatusRoutes');
const documentFileRoutes = require('./routes/documentFileRoutes');

const workTeamRoutes = require('./routes/workTeamRoutes');
const teamMemberRoutes = require('./routes/teamMemberRoutes');

const generalStatusRoutes = require('./routes/generalStatusRoutes');


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
const SWAGGER_IP = process.env.IP;
const SWAGGER_PORT = process.env.PORT;

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
app.use('/api/userRoles', userRoleRoutes);
app.use('/api/auditLog', auditLogRoutes);
// Объекты
app.use('/api/projects', projectRoutes);
app.use('/api/projectTypes', projectTypeRoutes);
app.use('/api/projectStatuses', projectStatusRoutes);
app.use('/api/projectStages', projectStageRoutes);
app.use('/api/projectStageStatuses', projectStageStatusRoutes);

// Блоки объекта
app.use('/api/projectBlocks', projectBlockRoutes);
// Этапы блока
app.use('/api/blockStages', blockStageRoutes);
// Подэтапы этапа
app.use('/api/stageSubsections', stageSubsectionRoutes);

// Задачи
app.use('/api/tasks', taskRoutes);
app.use('/api/taskStatuses', taskStatusRoutes);
app.use('/api/taskPriorities', taskPriorityRoutes);
startTaskDeadlineNotifierCron();

// Смета материалов
app.use('/api/materialEstimates', materialEstimateRoutes);
app.use('/api/materialEstimateItems', materialEstimateItemRoutes);
app.use('/api/materialEstimateItemTypes', materialEstimateItemTypeRoutes);

// Акты выполненных работ
app.use('/api/workPerformed', workPerformedRoutes);
app.use('/api/workPerformedItems', workPerformedItemRoutes);
app.use('/api/workPerformedItemTypes', workPerformedItemTypeRoutes);

// Материалы
app.use('/api/materials', materialRoutes);
app.use('/api/materialTypes', materialTypeRoutes);
app.use('/api/unitsOfMeasure', unitOfMeasureRoutes);

// Услуги
app.use('/api/services', serviceRoutes);
app.use('/api/serviceTypes', serviceTypeRoutes);

// Заявки на материалы
app.use('/api/materialRequests', materialRequestRoutes);
app.use('/api/materialRequestStatuses', materialRequestStatusRoutes);
app.use('/api/materialRequestItems', materialRequestItemRoutes);
app.use('/api/materialRequestItemStatuses', materialRequestItemStatusRoutes);
app.use('/api/materialRequestItemTypes', materialRequestItemTypeRoutes);

// Заявки на закуп
app.use('/api/purchaseOrders', purchaseOrderRoutes);
app.use('/api/purchaseOrderStatuses', purchaseOrderStatusRoutes);
app.use('/api/purchaseOrderItems', purchaseOrderItemRoutes);
app.use('/api/purchaseOrderItemStatuses', purchaseOrderItemStatusRoutes);
// Поставщики
app.use('/api/suppliers', supplierRoutes);
app.use('/api/supplierRating', supplierRatingRoutes);

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
app.use('/api/documentStages', documentStageRoutes);
app.use('/api/documentStatuses', documentStatusRoutes);
app.use('/api/documentFiles', documentFileRoutes);
// Общие статусы
app.use('/api/generalStatuses', generalStatusRoutes);


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