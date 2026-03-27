const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class TaskStatus extends Model { }

TaskStatus.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  name: {
    type: DataTypes.TEXT,
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
  sequelize,
  schema: 'construction',
  tableName: 'task_statuses',
  timestamps: false
});

module.exports = TaskStatus;
