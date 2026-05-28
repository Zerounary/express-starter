const { QuizActivity, QuizBank, QuizQuestion, Participant } = require('../models');
const crypto = require('crypto');

function generateToken() {
  return crypto.randomBytes(8).toString('hex');
}

async function listQuizActivities(req, res) {
  try {
    const { page = 1, pageSize = 10, isActive } = req.query;
    const offset = (page - 1) * pageSize;
    const where = isActive !== undefined ? { isActive: isActive === 'true' } : {};

    const { count, rows } = await QuizActivity.findAndCountAll({
      where,
      offset,
      limit: parseInt(pageSize),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: QuizBank,
          as: 'quizBank',
          attributes: ['id', 'name'],
        },
      ],
    });

    const activities = await Promise.all(
      rows.map(async (activity) => {
        const participantCount = await Participant.count({
          where: { activityId: activity.id },
        });
        return {
          ...activity.toJSON(),
          participantCount,
        };
      })
    );

    res.json({
      code: 0,
      data: {
        rows: activities,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
    });
  } catch (error) {
    console.error('List quiz activities error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

async function getQuizActivity(req, res) {
  try {
    const { id } = req.params;
    const activity = await QuizActivity.findByPk(id, {
      include: [
        {
          model: QuizBank,
          as: 'quizBank',
        },
      ],
    });
    if (!activity) {
      return res.status(404).json({ code: 404, error: '活动不存在' });
    }
    res.json({ code: 0, data: activity });
  } catch (error) {
    console.error('Get quiz activity error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

async function createQuizActivity(req, res) {
  try {
    const {
      quizBankId,
      bank_ids,
      name,
      description,
      intro,
      isActive,
      enabled,
      startTime,
      start_time,
      endTime,
      end_time,
    } = req.body;

    const finalQuizBankId = quizBankId || (Array.isArray(bank_ids) ? bank_ids[0] : bank_ids);
    const finalName = name;
    const finalDescription = description || intro;
    const finalIsActive = isActive !== undefined ? isActive : (enabled !== undefined ? enabled === 1 : true);
    const finalStartTime = startTime || start_time;
    const finalEndTime = endTime || end_time;

    console.log('Create activity data:', {
      finalQuizBankId,
      finalName,
      finalDescription,
      finalIsActive,
      finalStartTime,
      finalEndTime,
    });

    if (!finalQuizBankId || !finalName) {
      return res.status(400).json({ code: 400, error: '缺少必填字段' });
    }

    const quizBank = await QuizBank.findByPk(finalQuizBankId);
    if (!quizBank) {
      return res.status(404).json({ code: 404, error: '题库不存在' });
    }

    const token = generateToken();
    const activity = await QuizActivity.create({
      quizBankId: finalQuizBankId,
      name: finalName,
      description: finalDescription,
      token,
      isActive: finalIsActive,
      startTime: finalStartTime || null,
      endTime: finalEndTime || null,
    });

    res.json({ code: 0, data: activity });
  } catch (error) {
    console.error('Create quiz activity error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

async function updateQuizActivity(req, res) {
  try {
    const { id } = req.params;
    const { quizBankId, name, description, isActive, startTime, endTime } = req.body;

    const activity = await QuizActivity.findByPk(id);
    if (!activity) {
      return res.status(404).json({ code: 404, error: '活动不存在' });
    }

    if (quizBankId !== undefined) {
      const quizBank = await QuizBank.findByPk(quizBankId);
      if (!quizBank) {
        return res.status(404).json({ code: 404, error: '题库不存在' });
      }
    }

    await activity.update({
      quizBankId: quizBankId !== undefined ? quizBankId : activity.quizBankId,
      name: name !== undefined ? name : activity.name,
      description: description !== undefined ? description : activity.description,
      isActive: isActive !== undefined ? isActive : activity.isActive,
      startTime: startTime !== undefined ? startTime : activity.startTime,
      endTime: endTime !== undefined ? endTime : activity.endTime,
    });

    res.json({ code: 0, data: activity });
  } catch (error) {
    console.error('Update quiz activity error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

async function deleteQuizActivity(req, res) {
  try {
    const { id } = req.params;
    const activity = await QuizActivity.findByPk(id);
    if (!activity) {
      return res.status(404).json({ code: 404, error: '活动不存在' });
    }

    await activity.destroy();
    res.json({ code: 0, data: { message: '删除成功' } });
  } catch (error) {
    console.error('Delete quiz activity error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

module.exports = {
  listQuizActivities,
  getQuizActivity,
  createQuizActivity,
  updateQuizActivity,
  deleteQuizActivity,
};
