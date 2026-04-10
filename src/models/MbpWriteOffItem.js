const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class MbpWriteOffItem extends Model {}

MbpWriteOffItem.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  mbp_write_off_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  material_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  unit_of_measure: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantity: {
    type: DataTypes.DECIMAL(15, 3),
    allowNull: false
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  movement_id: {
    type: DataTypes.INTEGER,
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
  tableName: 'mbp_write_off_items',
  timestamps: false
});

module.exports = MbpWriteOffItem;
