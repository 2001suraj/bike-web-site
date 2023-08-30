const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Bike = sequelize.define('Bike', {
    name: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    price: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    photo: {
        type: DataTypes.TEXT,
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },
});

module.exports = Bike;