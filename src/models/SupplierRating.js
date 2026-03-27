const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SupplierRating = sequelize.define('SupplierRating', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  supplier_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quality: {
    type: DataTypes.INTEGER
  },
  time: {
    type: DataTypes.INTEGER
  },
  price: {
    type: DataTypes.INTEGER
  },
  comment: {
    type: DataTypes.TEXT
  },
  created_at: {
    type: DataTypes.DATE
  },
  updated_at: {
    type: DataTypes.DATE
  },
  deleted: {
    type: DataTypes.BOOLEAN
  }
}, {
  schema: 'construction',
  tableName: 'supplier_rating',
  timestamps: false
});

module.exports = SupplierRating;