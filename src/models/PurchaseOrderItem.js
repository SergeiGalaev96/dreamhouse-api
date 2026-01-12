const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class PurchaseOrderItem extends Model {}

PurchaseOrderItem.init({
  purchase_order_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  material_request_item_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  material_type: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  material_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantity: {
    type: DataTypes.DECIMAL,
    allowNull: false
  },
  unit_of_measure: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL,
    allowNull: false
  },
  summ: {
    type: DataTypes.DECIMAL,
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  delivered_quantity: {
    type: DataTypes.DECIMAL,
    allowNull: true
  },
  
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE,
  deleted: DataTypes.BOOLEAN
}, {
  sequelize,
  schema: 'construction',
  tableName: 'purchase_order_items',
  timestamps: false
});

module.exports = PurchaseOrderItem;