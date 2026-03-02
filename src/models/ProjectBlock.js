const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProjectBlock = sequelize.define('ProjectBlock', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  planned_budget: {
    type: DataTypes.DECIMAL(20, 4),
    allowNull: false
  },
  total_area: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false
  },
  sale_area: {
    type: DataTypes.DECIMAL(10, 4),
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
  tableName: 'project_blocks',
  timestamps: false
});

module.exports = ProjectBlock;