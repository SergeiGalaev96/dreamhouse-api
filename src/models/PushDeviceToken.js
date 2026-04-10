const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PushDeviceToken = sequelize.define('PushDeviceToken', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  token: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  platform: {
    type: DataTypes.STRING(30)
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  tableName: 'push_device_tokens',
  timestamps: false
});

module.exports = PushDeviceToken;
