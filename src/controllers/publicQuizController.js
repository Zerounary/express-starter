const { QuizActivity, QuizBank, QuizQuestion, StudentNo, Participant } = require('../models');
const { generateToken } = require('../config/jwt');

async function getActivity(req, res) {
  try {
    const { token } = req.publicUser;
    
    const activity = await QuizActivity.findOne({
      where: { token, isActive: true },
      include: [
        {
          model: QuizBank,
          as: 'quizBank',
          include: [
            {
              model: QuizQuestion,
              as: 'questions',
            },
          ],
        },
      ],
    });

    if (!activity) {
      return res.status(404).json({ code: 404, error: '活动不存在或已关闭' });
    }

    const { password: _, ...quizBankWithoutPassword } = activity.quizBank.toJSON();
    const questions = quizBankWithoutPassword.questions.map((q) => ({
      ...q,
      answer: undefined,
    }));

    res.json({
      code: 0,
      data: {
        ...activity.toJSON(),
        quizBank: {
          ...quizBankWithoutPassword,
          questions,
        },
      },
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

async function checkStudentNo(req, res) {
  try {
    const { token } = req.publicUser;
    const { studentNo } = req.body;

    if (!studentNo) {
      return res.status(400).json({ code: 400, error: '学号不能为空' });
    }

    const activity = await QuizActivity.findOne({
      where: { token, isActive: true },
    });

    if (!activity) {
      return res.status(404).json({ code: 404, error: '活动不存在或已关闭' });
    }

    const student = await StudentNo.findOne({ where: { studentNo } });
    if (!student) {
      return res.status(404).json({ code: 404, error: '学号不存在' });
    }

    const existingParticipant = await Participant.findOne({
      where: { activityId: activity.id, studentNoId: student.id },
    });

    if (existingParticipant && existingParticipant.submittedAt) {
      return res.status(400).json({ code: 400, error: '该学号已完成答题' });
    }

    res.json({
      code: 0,
      data: {
        studentNo: student.studentNo,
        realName: student.realName,
        className: student.className,
        grade: student.grade,
        hasStarted: !!existingParticipant,
      },
    });
  } catch (error) {
    console.error('Check student no error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

async function login(req, res) {
  try {
    const { token } = req.publicUser;
    const { studentNo } = req.body;

    if (!studentNo) {
      return res.status(400).json({ code: 400, error: '学号不能为空' });
    }

    const activity = await QuizActivity.findOne({
      where: { token, isActive: true },
    });

    if (!activity) {
      return res.status(404).json({ code: 404, error: '活动不存在或已关闭' });
    }

    const student = await StudentNo.findOne({ where: { studentNo } });
    if (!student) {
      return res.status(404).json({ code: 404, error: '学号不存在' });
    }

    let participant = await Participant.findOne({
      where: { activityId: activity.id, studentNoId: student.id },
    });

    if (!participant) {
      participant = await Participant.create({
        activityId: activity.id,
        studentNoId: student.id,
        answers: null,
        score: 0,
      });
    }

    if (participant.submittedAt) {
      return res.status(400).json({ code: 400, error: '该学号已完成答题' });
    }

    const sessionToken = generateToken({
      type: 'public',
      activityId: activity.id,
      participantId: participant.id,
      studentNoId: student.id,
    });

    res.json({
      code: 0,
      data: {
        token: sessionToken,
        participantId: participant.id,
        studentNo: student.studentNo,
        realName: student.realName,
      },
    });
  } catch (error) {
    console.error('Public login error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

async function submitProgress(req, res) {
  try {
    const { participantId, studentNoId } = req.publicUser;
    const { answers } = req.body;

    const participant = await Participant.findByPk(participantId);
    if (!participant) {
      return res.status(404).json({ code: 404, error: '参与者不存在' });
    }

    if (participant.submittedAt) {
      return res.status(400).json({ code: 400, error: '已提交，不能修改' });
    }

    const activity = await QuizActivity.findByPk(participant.activityId, {
      include: [
        {
          model: QuizBank,
          as: 'quizBank',
          include: [
            {
              model: QuizQuestion,
              as: 'questions',
            },
          ],
        },
      ],
    });

    if (!activity) {
      return res.status(404).json({ code: 404, error: '活动不存在' });
    }

    const questions = activity.quizBank.questions;
    let totalScore = 0;

    questions.forEach((question) => {
      const userAnswer = answers[question.id];
      if (userAnswer) {
        const correctAnswer = question.answer;
        if (String(userAnswer).trim() === String(correctAnswer).trim()) {
          totalScore += question.score;
        }
      }
    });

    await participant.update({
      answers: JSON.stringify(answers),
      score: totalScore,
      submittedAt: new Date(),
    });

    res.json({
      code: 0,
      data: {
        score: totalScore,
        totalQuestions: questions.length,
      },
    });
  } catch (error) {
    console.error('Submit progress error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

async function getResult(req, res) {
  try {
    const { participantId } = req.params;
    const { participantId: authParticipantId } = req.publicUser;

    if (parseInt(participantId) !== parseInt(authParticipantId)) {
      return res.status(403).json({ code: 403, error: '无权访问此结果' });
    }

    const participant = await Participant.findByPk(participantId, {
      include: [
        {
          model: QuizActivity,
          as: 'activity',
          include: [
            {
              model: QuizBank,
              as: 'quizBank',
              include: [
                {
                  model: QuizQuestion,
                  as: 'questions',
                },
              ],
            },
          ],
        },
        {
          model: StudentNo,
          as: 'studentNo',
        },
      ],
    });

    if (!participant) {
      return res.status(404).json({ code: 404, error: '参与者不存在' });
    }

    if (!participant.submittedAt) {
      return res.status(400).json({ code: 400, error: '尚未提交' });
    }

    const questions = participant.activity.quizBank.questions;
    const answers = participant.answers ? JSON.parse(participant.answers) : {};

    const questionResults = questions.map((q) => ({
      id: q.id,
      question: q.question,
      type: q.type,
      options: q.options ? JSON.parse(q.options) : null,
      userAnswer: answers[q.id] || null,
      correctAnswer: q.answer,
      score: q.score,
      isCorrect: String(answers[q.id] || '').trim() === String(q.answer).trim(),
    }));

    res.json({
      code: 0,
      data: {
        participantId: participant.id,
        studentNo: participant.studentNo.studentNo,
        realName: participant.studentNo.realName,
        score: participant.score,
        totalScore: questions.reduce((sum, q) => sum + q.score, 0),
        submittedAt: participant.submittedAt,
        questions: questionResults,
      },
    });
  } catch (error) {
    console.error('Get result error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

module.exports = {
  getActivity,
  checkStudentNo,
  login,
  submitProgress,
  getResult,
};
