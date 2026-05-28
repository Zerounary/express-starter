const { QuizActivity, QuizQuestion, Participant, StudentNo } = require('../models');
const { Op } = require('sequelize');

async function getQuizActivityStats(req, res) {
  try {
    const { id } = req.params;
    const { type = 'overview' } = req.query;

    const activity = await QuizActivity.findByPk(id);
    if (!activity) {
      return res.status(404).json({ code: 404, error: '活动不存在' });
    }

    const participants = await Participant.findAll({
      where: { activityId: id },
      include: [
        {
          model: StudentNo,
          as: 'studentNo',
        },
      ],
    });

    const questions = await QuizQuestion.findAll({
      where: { quizBankId: activity.quizBankId },
    });

    if (type === 'overview') {
      const totalParticipants = participants.length;
      const submittedParticipants = participants.filter((p) => p.submittedAt).length;
      const avgScore =
        submittedParticipants > 0
          ? participants.reduce((sum, p) => sum + p.score, 0) / submittedParticipants
          : 0;
      const maxScore = participants.reduce((max, p) => Math.max(max, p.score), 0);
      const minScore = participants.reduce((min, p) => Math.min(min, p.score), Infinity);

      res.json({
        code: 0,
        data: {
          totalParticipants,
          submittedParticipants,
          avgScore: Math.round(avgScore * 100) / 100,
          maxScore: minScore === Infinity ? 0 : maxScore,
          minScore: minScore === Infinity ? 0 : minScore,
        },
      });
    } else if (type === 'personal') {
      const personalRanking = participants
        .filter((p) => p.submittedAt)
        .map((p) => ({
          id: p.id,
          studentNo: p.studentNo?.studentNo,
          realName: p.studentNo?.realName,
          className: p.studentNo?.className,
          grade: p.studentNo?.grade,
          score: p.score,
          submittedAt: p.submittedAt,
        }))
        .sort((a, b) => b.score - a.score);

      res.json({
        code: 0,
        data: {
          rows: personalRanking,
          total: personalRanking.length,
        },
      });
    } else if (type === 'class') {
      const classStats = {};
      participants.forEach((p) => {
        if (p.studentNo?.className && p.submittedAt) {
          if (!classStats[p.studentNo.className]) {
            classStats[p.studentNo.className] = { total: 0, score: 0, count: 0 };
          }
          classStats[p.studentNo.className].total++;
          classStats[p.studentNo.className].score += p.score;
          classStats[p.studentNo.className].count++;
        }
      });

      const classRanking = Object.entries(classStats)
        .map(([className, stats]) => ({
          className,
          avgScore: Math.round((stats.score / stats.count) * 100) / 100,
          participantCount: stats.count,
        }))
        .sort((a, b) => b.avgScore - a.avgScore);

      res.json({
        code: 0,
        data: {
          rows: classRanking,
          total: classRanking.length,
        },
      });
    } else if (type === 'grade') {
      const gradeStats = {};
      participants.forEach((p) => {
        if (p.studentNo?.grade && p.submittedAt) {
          if (!gradeStats[p.studentNo.grade]) {
            gradeStats[p.studentNo.grade] = { total: 0, score: 0, count: 0 };
          }
          gradeStats[p.studentNo.grade].total++;
          gradeStats[p.studentNo.grade].score += p.score;
          gradeStats[p.studentNo.grade].count++;
        }
      });

      const gradeRanking = Object.entries(gradeStats)
        .map(([grade, stats]) => ({
          grade,
          avgScore: Math.round((stats.score / stats.count) * 100) / 100,
          participantCount: stats.count,
        }))
        .sort((a, b) => b.avgScore - a.avgScore);

      res.json({
        code: 0,
        data: {
          rows: gradeRanking,
          total: gradeRanking.length,
        },
      });
    } else {
      res.status(400).json({ code: 400, error: '无效的统计类型' });
    }
  } catch (error) {
    console.error('Get quiz activity stats error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

module.exports = {
  getQuizActivityStats,
};
