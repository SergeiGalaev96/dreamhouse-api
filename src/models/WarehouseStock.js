const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WarehouseStock = sequelize.define('WarehouseStock', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  warehouse_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  material_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantity: {
    type: DataTypes.DECIMAL(12,3),
    defaultValue: 0
  },
  reserved_quantity: {
    type: DataTypes.DECIMAL(12,3),
    defaultValue: 0
  },
  min: {
    type: DataTypes.DECIMAL(12,3),
    defaultValue: 0
  },
  max: {
    type: DataTypes.DECIMAL(12,3),
    allowNull: true
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true
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
  tableName: 'warehouse_stock',
  timestamps: false
});

module.exports = WarehouseStock;