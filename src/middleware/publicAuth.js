const { verifyToken } = require('../config/jwt');
const { QuizActivity } = require('../models');

async function publicTokenMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ code: 401, error: '未提供认证令牌' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (decoded.type === 'public') {
      req.publicUser = decoded;
      return next();
    }

    const activity = await QuizActivity.findOne({
      where: { token: decoded.token || token, isActive: true },
    });

    if (!activity) {
      return res.status(401).json({ code: 401, error: '活动令牌无效或活动已关闭' });
    }

    req.publicUser = {
      token: decoded.token || token,
      activityId: activity.id,
    };

    next();
  } catch (error) {
    return res.status(401).json({ code: 401, error: '认证令牌无效或已过期' });
  }
}

module.exports = {
  publicTokenMiddleware,
};
