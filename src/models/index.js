const sequelize = require('../config/database');
const User = require('./User');
const QuizBank = require('./QuizBank');
const QuizQuestion = require('./QuizQuestion');
const QuizActivity = require('./QuizActivity');
const StudentNo = require('./StudentNo');
const Participant = require('./Participant');

// Associations
QuizBank.hasMany(QuizQuestion, { foreignKey: 'quizBankId', as: 'questions' });
QuizQuestion.belongsTo(QuizBank, { foreignKey: 'quizBankId', as: 'quizBank' });

QuizBank.hasMany(QuizActivity, { foreignKey: 'quizBankId', as: 'activities' });
QuizActivity.belongsTo(QuizBank, { foreignKey: 'quizBankId', as: 'quizBank' });

QuizActivity.hasMany(Participant, { foreignKey: 'activityId', as: 'participants' });
Participant.belongsTo(QuizActivity, { foreignKey: 'activityId', as: 'activity' });

StudentNo.hasMany(Participant, { foreignKey: 'studentNoId', as: 'participants' });
Participant.belongsTo(StudentNo, { foreignKey: 'studentNoId', as: 'studentNo' });

module.exports = {
  sequelize,
  User,
  QuizBank,
  QuizQuestion,
  QuizActivity,
  StudentNo,
  Participant,
};
