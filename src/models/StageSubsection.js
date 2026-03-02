const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StageSubsection = sequelize.define('StageSubsection', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  stage_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  multiply_by_coefficient: {
    type: DataTypes.BOOLEAN
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
  tableName: 'stage_subsections',
  timestamps: false
});

module.exports = StageSubsection;