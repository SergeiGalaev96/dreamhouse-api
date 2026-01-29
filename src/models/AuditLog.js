const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    entity_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    old_values: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    new_values: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    comment: {
      type: DataTypes.TEXT
    },
    created_at: {
      type: DataTypes.DATE
    }
  },
  {
    schema: 'construction',
    tableName: 'audit_log',
    timestamps: false
  }
);

module.exports = AuditLog;
