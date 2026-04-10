const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class MaterialWriteOff extends Model {}

MaterialWriteOff.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  block_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  warehouse_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  work_performed_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  work_performed_item_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  write_off_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  foreman_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  signed_by_foreman: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  signed_by_foreman_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  planning_engineer_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  signed_by_planning_engineer: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  signed_by_planning_engineer_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  main_engineer_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  signed_by_main_engineer: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  signed_by_main_engineer_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  general_director_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  signed_by_general_director: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  signed_by_general_director_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  posted_at: {
    type: DataTypes.DATE,
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
  sequelize,
  schema: 'construction',
  tableName: 'material_write_offs',
  timestamps: false
});

module.exports = MaterialWriteOff;
