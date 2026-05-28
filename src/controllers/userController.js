const bcrypt = require('bcryptjs');
const { User } = require('../models');

async function listUsers(req, res) {
  try {
    const { page = 1, pageSize = 10, username, role } = req.query;
    const offset = (page - 1) * pageSize;
    const where = {};
    if (username) where.username = { [require('sequelize').Op.like]: `%${username}%` };
    if (role) where.role = role;

    const { count, rows } = await User.findAndCountAll({
      where,
      offset,
      limit: parseInt(pageSize),
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] },
    });

    res.json({
      code: 0,
      data: {
        rows: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

async function getUser(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
    });
    if (!user) {
      return res.status(404).json({ code: 404, error: '用户不存在' });
    }
    res.json({ code: 0, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

async function createUser(req, res) {
  try {
    const { username, password, realName, role } = req.body;
    if (!username || !password || !realName) {
      return res.status(400).json({ code: 400, error: '用户名、密码和姓名不能为空' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      password: hashedPassword,
      realName,
      role: role || 'admin',
    });

    const { password: _, ...userWithoutPassword } = newUser.toJSON();
    res.json({ code: 0, data: userWithoutPassword });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ code: 400, error: '用户名已存在' });
    }
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { username, password, realName, role } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ code: 404, error: '用户不存在' });
    }

    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (password !== undefined) updateData.password = await bcrypt.hash(password, 10);
    if (realName !== undefined) updateData.realName = realName;
    if (role !== undefined) updateData.role = role;

    await user.update(updateData);

    const { password: _, ...userWithoutPassword } = user.toJSON();
    res.json({ code: 0, data: userWithoutPassword });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ code: 400, error: '用户名已存在' });
    }
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ code: 404, error: '用户不存在' });
    }

    await user.destroy();
    res.json({ code: 0, data: { message: '删除成功' } });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
