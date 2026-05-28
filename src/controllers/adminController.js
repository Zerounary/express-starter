async function createTrial(req, res) {
  try {
    const { email, name } = req.body;
    
    res.json({
      code: 0,
      data: {
        message: '试用申请已提交',
        email,
        name,
      },
    });
  } catch (error) {
    console.error('Create trial error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

module.exports = {
  createTrial,
};
