const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QuizQuestion = sequelize.define('QuizQuestion', {
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
  type: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  options: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  answer: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
}, {
  tableName: 'quiz_questions',
});

module.exports = QuizQuestion;
