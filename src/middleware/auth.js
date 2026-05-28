const { verifyToken } = require('../config/jwt');

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ code: 401, error: '未提供认证令牌' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ code: 401, error: '认证令牌无效或已过期' });
  }
}

function publicAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ code: 401, error: '未提供认证令牌' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    req.publicUser = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ code: 401, error: '认证令牌无效或已过期' });
  }
}

module.exports = {
  authMiddleware,
  publicAuthMiddleware,
};
