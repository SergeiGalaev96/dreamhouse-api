const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class PurchaseOrder extends Model {}

PurchaseOrder.init({
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  supplier_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  created_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE,
  deleted: DataTypes.BOOLEAN
}, {
  sequelize,
  schema: 'construction',
  tableName: 'purchase_orders',
  timestamps: false
});

module.exports = PurchaseOrder;