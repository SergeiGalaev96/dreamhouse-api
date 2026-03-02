const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class MaterialEstimateItem extends Model { }

MaterialEstimateItem.init({
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	material_estimate_id: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	subsection_id: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	item_type: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	service_type: {
		type: DataTypes.INTEGER,
		allowNull: true
	},
	service_id: {
		type: DataTypes.INTEGER,
		allowNull: true
	},
	material_type: {
		type: DataTypes.INTEGER,
		allowNull: true
	},
	material_id: {
		type: DataTypes.INTEGER,
		allowNull: true
	},
	unit_of_measure: {
		type: DataTypes.INTEGER,
		allowNull: true
	},
	quantity_planned: {
		type: DataTypes.DECIMAL(15, 6),
		allowNull: false
	},
	coefficient: {
		type: DataTypes.DECIMAL(3, 2)
	},
	currency: {
		type: DataTypes.INTEGER,
		allowNull: true
	},
	price: {
		type: DataTypes.DECIMAL(3, 2)
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
		tableName: 'material_estimate_items',
		timestamps: false
	}
);

module.exports = MaterialEstimateItem;