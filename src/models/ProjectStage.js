const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProjectStage = sequelize.define('ProjectStage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  planned_cost: {
    type: DataTypes.DECIMAL(12,2),
    allowNull: true
  },
  actual_cost: {
    type: DataTypes.DECIMAL(12,2),
    allowNull: true
  },
  progress_percent: {
    type: DataTypes.DECIMAL(5,2),
    defaultValue: 0
  },
  responsible_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1
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
  tableName: 'project_stages',
  timestamps: false
});

module.exports = ProjectStage;