const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DocumentFile = sequelize.define('DocumentFile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  document_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  file_path: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  uploaded_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  mime_type: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  file_size: {
    type: DataTypes.BIGINT,
    allowNull: false
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
  tableName: 'document_files',
  timestamps: false
});

module.exports = DocumentFile;