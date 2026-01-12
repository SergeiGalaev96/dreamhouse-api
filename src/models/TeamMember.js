const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TeamMember = sequelize.define('TeamMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  team_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },  
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  role_in_team: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  joined_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  left_date: {
    type: DataTypes.DATE,
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
  tableName: 'team_members',
  timestamps: false
});

module.exports = TeamMember;