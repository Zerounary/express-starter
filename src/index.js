const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./config/logger');

// Fix sqlite3 bindings for pkg
if (typeof process.pkg !== 'undefined') {
  const bindingsPath = path.join(path.dirname(process.execPath), 'node_modules/sqlite3/build/Release/node_sqlite3.node');
  const fs = require('fs');
  if (fs.existsSync(bindingsPath)) {
    const bindings = require('bindings');
    const originalResolve = bindings.resolve;
    bindings.resolve = function (opts) {
      if (opts.name === 'sqlite3') {
        return bindingsPath;
      }
      return originalResolve.call(this, opts);
    };
  }
}

const { sequelize, User } = require('./models');
const bcrypt = require('bcryptjs');

// Routes
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const studentNoRoutes = require('./routes/studentNo');
const userRoutes = require('./routes/user');
const publicQuizRoutes = require('./routes/publicQuiz');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from front-end dist directory
const isPkg = typeof process.pkg !== 'undefined';
const distPath = isPkg
  ? path.join(path.dirname(process.execPath), 'front-end/dist')
  : path.join(__dirname, '../front-end/dist');
app.use(express.static(distPath));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/student-nos', studentNoRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quiz/public', publicQuizRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback - serve index.html for non-API routes
app.use((req, res) => {
  if (req.path.startsWith('/api') || req.path === '/health') {
    res.status(404).json({ code: 404, error: '接口不存在' });
  } else {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Server error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  res.status(500).json({ code: 500, error: '服务器内部错误' });
});

// Initialize database and start server
async function initializeServer() {
  try {
    // Sync database
    await sequelize.sync();
    logger.info('数据库同步完成');

    // Create default admin user if not exists
    const adminCount = await User.count({ where: { username: 'admin' } });
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('root123', 10);
      await User.create({
        username: 'admin',
        password: hashedPassword,
        realName: '管理员',
        role: 'admin',
      });
      logger.info('默认管理员用户已创建 (用户名: admin, 密码: root123)');
    }

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`服务器运行在 http://localhost:${PORT}`);
      logger.info(`健康检查: http://localhost:${PORT}/health`);
    });

    // Keep process alive
    process.on('SIGINT', () => {
      logger.info('正在关闭服务器...');
      server.close(() => {
        logger.info('服务器已关闭');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('服务器初始化失败', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

initializeServer();
