const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class MaterialRequestItem extends Model { }

MaterialRequestItem.init({
  material_request_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  material_estimate_item_id: {
    type: DataTypes.INTEGER
  },
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
  currency: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  currency_rate: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  coefficient: {
    type: DataTypes.DECIMAL(3, 2)
  },
  summ: {
    type: DataTypes.DECIMAL,
    allowNull: true
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  stage_id: {
    type: DataTypes.INTEGER
  },
  subsection_id: {
    type: DataTypes.INTEGER
  },
  item_type: {
    type: DataTypes.INTEGER
  },
  comment: {
    type: DataTypes.TEXT
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
