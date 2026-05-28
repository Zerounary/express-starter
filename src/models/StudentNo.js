const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StudentNo = sequelize.define('StudentNo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  studentNo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  realName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  className: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  grade: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
}, {
  tableName: 'student_nos',
});

module.exports = StudentNo;
