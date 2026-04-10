const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class WorkPerformed extends Model { }

WorkPerformed.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  block_id: DataTypes.INTEGER,
  project_id: DataTypes.INTEGER,
  code: DataTypes.TEXT,
  status: DataTypes.INTEGER,


  foreman_user_id: DataTypes.INTEGER,
  signed_by_foreman: DataTypes.BOOLEAN,
  signed_by_foreman_time: DataTypes.DATE,

  planning_engineer_user_id: DataTypes.INTEGER,
  signed_by_planning_engineer: DataTypes.BOOLEAN,
  signed_by_planning_engineer_time: DataTypes.DATE,

  main_engineer_user_id: DataTypes.INTEGER,
  signed_by_main_engineer: DataTypes.BOOLEAN,
  signed_by_main_engineer_time: DataTypes.DATE,

  performed_person_name: DataTypes.TEXT,
  advance_payment: DataTypes.DECIMAL,

  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE,
  deleted: DataTypes.BOOLEAN
}, {
  sequelize,
  schema: 'construction',
  tableName: 'work_performed',
  timestamps: false
});

module.exports = WorkPerformed;
