const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MaterialWriteOffStatus = sequelize.define('MaterialWriteOffStatus', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
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
  tableName: 'material_write_off_statuses',
  timestamps: false
});

module.exports = MaterialWriteOffStatus;
