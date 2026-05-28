const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Participant = sequelize.define('Participant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  activityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'quiz_activities',
      key: 'id',
    },
  },
  studentNoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'student_nos',
      key: 'id',
    },
  },
  answers: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'participants',
});

module.exports = Participant;
