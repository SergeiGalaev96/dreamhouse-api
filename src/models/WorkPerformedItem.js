const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class WorkPerformedItem extends Model { }

WorkPerformedItem.init({
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	service_type: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	service_id: {
		type: DataTypes.INTEGER,
		allowNull: false
	},

	name: {
		type: DataTypes.TEXT,
		allowNull: false
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
	unit_of_measure: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	quantity: {
		type: DataTypes.DECIMAL,
		allowNull: false
	},
	currency: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	currency_rate: {
		type: DataTypes.DECIMAL
	},
	price: {
		type: DataTypes.DECIMAL,
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
},
	{
		sequelize,
		schema: 'construction',
		tableName: 'work_performed_items',
		timestamps: false
	}
);

module.exports = WorkPerformedItem;