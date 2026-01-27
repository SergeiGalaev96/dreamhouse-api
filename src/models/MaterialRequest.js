const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class MaterialRequest extends Model {}

MaterialRequest.init({
  project_id: DataTypes.INTEGER,
  status: DataTypes.INTEGER,

  approved_by_foreman: DataTypes.BOOLEAN,
  approved_by_foreman_time: DataTypes.DATE,
  foreman_user_id: DataTypes.INTEGER,

  approved_by_site_manager: DataTypes.BOOLEAN,
  approved_by_site_manager_time: DataTypes.DATE,
  site_manager_user_id: DataTypes.INTEGER,

  approved_by_purchasing_agent: DataTypes.BOOLEAN,
  approved_by_purchasing_agent_time: DataTypes.DATE,
  purchasing_agent_user_id: DataTypes.INTEGER,

  approved_by_planning_engineer: DataTypes.BOOLEAN,
  approved_by_planning_engineer_time: DataTypes.DATE,
  planning_engineer_user_id: DataTypes.INTEGER,

  approved_by_main_engineer: DataTypes.BOOLEAN,
  approved_by_main_engineer_time: DataTypes.DATE,
  main_engineer_user_id: DataTypes.INTEGER,
  stage_id: DataTypes.INTEGER,

  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE,
  deleted: DataTypes.BOOLEAN
}, {
  sequelize,
  schema: 'construction',
  tableName: 'material_requests',
  timestamps: false
});

module.exports = MaterialRequest;