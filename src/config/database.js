const { Sequelize } = require('sequelize');
const pg = require('pg');
require('dotenv').config();

/* ================================
   PG TYPE PARSERS
================================ */

// int
pg.types.setTypeParser(23, val => parseInt(val, 10));
pg.types.setTypeParser(20, val => parseInt(val, 10));

// numeric / float
pg.types.setTypeParser(1700, val => parseFloat(val));
pg.types.setTypeParser(701, val => parseFloat(val));

// ❗ TIMESTAMP → string (НЕ Date)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, v => v);
pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, v => v);

/* ================================
   SEQUELIZE INIT
================================ */

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    dialectModule: pg,

    logging: process.env.NODE_ENV === 'development' ? console.log : false,

    dialectOptions: {
      application_name: 'dreamhouse-api'
    },
    hooks: {
      afterConnect: async (connection) => {
        // фиксируем TZ сессии
        await connection.query(`SET TIME ZONE 'Asia/Bishkek'`);

        // (можно оставить временно для отладки)
        // const res = await connection.query(`SHOW TIME ZONE`);
        // console.log('DB session timezone:', res.rows[0]);
      }
    },

    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;