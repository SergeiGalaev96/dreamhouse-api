const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class MaterialEstimateItemType extends Model { }

MaterialEstimateItemType.init({
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	name: {
		type: DataTypes.TEXT,
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
		tableName: 'material_estimate_item_types',
		timestamps: false
	}
);

module.exports = MaterialEstimateItemType;