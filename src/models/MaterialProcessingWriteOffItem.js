const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class MaterialProcessingWriteOffItem extends Model {}

MaterialProcessingWriteOffItem.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  processing_write_off_id: {
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
  tableName: 'material_processing_write_off_items',
  timestamps: false
});

module.exports = MaterialProcessingWriteOffItem;
