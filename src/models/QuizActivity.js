const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QuizActivity = sequelize.define('QuizActivity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  quizBankId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'quiz_banks',
      key: 'id',
    },
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  token: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'quiz_activities',
});

module.exports = QuizActivity;
