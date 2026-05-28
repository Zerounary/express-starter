const { Sequelize } = require('sequelize');
const path = require('path');

// Determine database path - use executable directory in pkg, or project root in dev
const isPkg = typeof process.pkg !== 'undefined';
const dbPath = isPkg
  ? path.join(path.dirname(process.execPath), 'database.sqlite')
  : path.join(__dirname, '../../database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false,
  define: {
    timestamps: true,
    underscored: true,
  },
});

module.exports = sequelize;
