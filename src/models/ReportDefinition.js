const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReportDefinition = sequelize.define('ReportDefinition', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING(80),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  report_url: {
    type: DataTypes.STRING(300),
    allowNull: false
  },
  params_schema: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  allow_pdf: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  allow_docx: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  allow_xlsx: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
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
  tableName: 'report_definitions',
  timestamps: false
});

module.exports = ReportDefinition;
