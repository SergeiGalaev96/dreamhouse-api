const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WarehouseTransferStatus = sequelize.define('WarehouseTransferStatus', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
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
  tableName: 'warehouse_transfer_statuses',
  timestamps: false
});

module.exports = WarehouseTransferStatus;
