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
}, {
  schema: 'construction',
  tableName: 'supplier_rating',
  timestamps: false
});

module.exports = SupplierRating;