const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QuizBank = sequelize.define('QuizBank', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'quiz_banks',
});

module.exports = QuizBank;
