const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    type: {
        type: DataTypes.STRING(50), // task_assigned, task_updated, etc
        allowNull: false
    },

    title: {
        type: DataTypes.STRING(300),
        allowNull: false
    },

    message: {
        type: DataTypes.TEXT
    },

    entity_type: {
        type: DataTypes.STRING(50) // task, purchase_order
    },

    entity_id: {
        type: DataTypes.INTEGER
    },

    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
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
    tableName: 'notifications',
    timestamps: false
});

module.exports = Notification;