const { Sequelize } = require('sequelize');
const pg = require('pg');
require('dotenv').config();

// настроили парсеры
pg.types.setTypeParser(23, val => parseInt(val, 10));
pg.types.setTypeParser(20, val => parseInt(val, 10));
pg.types.setTypeParser(1700, val => parseFloat(val));
pg.types.setTypeParser(701, val => parseFloat(val));

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    dialectModule: pg,
    dialectOptions: {
      useUTC: false
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
