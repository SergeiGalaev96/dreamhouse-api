const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  stage_id: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  price: {
    type: DataTypes.DECIMAL(10,2),
    defaultValue: 1
  },
  description: {
    type: DataTypes.TEXT,
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
  tableName: 'documents',
  timestamps: false
});

module.exports = Document;