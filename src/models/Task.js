const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Task extends Model { }

Task.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  created_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  responsible_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  deadline: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  notify_3_days: {
    type: DataTypes.BOOLEAN
  },
  notify_1_day: {
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
  sequelize,
  schema: 'construction',
  tableName: 'tasks',
  timestamps: false
});

module.exports = Task;
