const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class MaterialRequestItem extends Model {}

MaterialRequestItem.init({
  material_type: {
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
    type: DataTypes.DECIMAL,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL,
    allowNull: true
  },
  summ: {
    type: DataTypes.DECIMAL,
    allowNull: true
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  material_request_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  currency: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE,
  deleted: DataTypes.BOOLEAN
}, {
  sequelize,
  schema: 'construction',
  tableName: 'material_request_items',
  timestamps: false
});

module.exports = MaterialRequestItem;