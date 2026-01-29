const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class MaterialStatement extends Model { }

MaterialStatement.init({
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	project_id: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	status: {
		type: DataTypes.INTEGER,
		allowNull: false,
		comment: '1=draft, 2=approved, 3=archived'
	},
	created_user_id: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	approved_user_id: {
		type: DataTypes.INTEGER,
		allowNull: true
	},
	approved_at: {
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
},
	{
		sequelize,
		schema: 'construction',
		tableName: 'material_statements',
		timestamps: false
	}
);

module.exports = MaterialStatement;