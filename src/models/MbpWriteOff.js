const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class MbpWriteOff extends Model {}

MbpWriteOff.init({
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
  signed_by_foreman: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  signed_by_foreman_time: {
    type: DataTypes.DATE,
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
  signed_by_main_engineer: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  signed_by_main_engineer_time: {
    type: DataTypes.DATE,
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
  tableName: 'mbp_write_offs',
  timestamps: false
});

module.exports = MbpWriteOff;
