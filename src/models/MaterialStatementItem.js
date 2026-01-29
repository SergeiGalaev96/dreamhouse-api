const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class MaterialStatementItem extends Model { }

MaterialStatementItem.init({
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	material_statement_id: {
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
	unit_of_measure: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	quantity_planned: {
		type: DataTypes.DECIMAL(15, 6),
		allowNull: false
	},
	comment: {
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
},
	{
		sequelize,
		schema: 'construction',
		tableName: 'material_statement_items',
		timestamps: false
	}
);

module.exports = MaterialStatementItem;