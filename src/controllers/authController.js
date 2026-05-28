const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { generateToken } = require('../config/jwt');

async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ code: 400, error: '用户名和密码不能为空' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ code: 401, error: '用户名或密码错误' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ code: 401, error: '用户名或密码错误' });
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      realName: user.realName,
      role: user.role,
    });

    res.json({
      code: 0,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          realName: user.realName,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

async function logout(req, res) {
  try {
    res.json({ code: 0, data: { message: '退出成功' } });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

module.exports = {
  login,
  logout,
};
