const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CurrencyRate = sequelize.define(
  'CurrencyRate',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    currency_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    rate: {
      type: DataTypes.DECIMAL(15, 6),
      allowNull: false
    },

    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },

    created_at: {
      type: DataTypes.DATE
    },

    updated_at: {
      type: DataTypes.DATE
    },

    deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    schema: 'construction',
    tableName: 'currency_rates',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['currency_id', 'date']
      }
    ]
  }
);

module.exports = CurrencyRate;