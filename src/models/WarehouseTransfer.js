const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WarehouseTransfer = sequelize.define('WarehouseTransfer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  posted_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  from_warehouse_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  to_warehouse_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  created_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sender_signed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sender_signed_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  sender_signed_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  receiver_signed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  receiver_signed_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  receiver_signed_time: {
    type: DataTypes.DATE,
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
  tableName: 'warehouse_transfers',
  timestamps: false
});

module.exports = WarehouseTransfer;
