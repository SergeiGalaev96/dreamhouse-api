const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OutgoingInvoice = sequelize.define('OutgoingInvoice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  number: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  stage_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  warehouse_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  issued_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  received_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  total_amount: {
    type: DataTypes.DECIMAL(15,2),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(30),
    defaultValue: 'draft'
  },
  notes: {
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
  schema: 'construction',
  tableName: 'outgoing_invoices',
  timestamps: false
});

module.exports = OutgoingInvoice;