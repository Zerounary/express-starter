const { QuizBank, QuizQuestion } = require('../models');

// Quiz Bank CRUD
async function listQuizBanks(req, res) {
  try {
    const { page = 1, pageSize = 10, isActive } = req.query;
    const offset = (page - 1) * pageSize;
    const where = isActive !== undefined ? { isActive: isActive === 'true' } : {};

    const { count, rows } = await QuizBank.findAndCountAll({
      where,
      offset,
      limit: parseInt(pageSize),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: QuizQuestion,
          as: 'questions',
          attributes: ['id'],
        },
      ],
    });

    const banks = rows.map((bank) => ({
      ...bank.toJSON(),
      questionCount: bank.questions ? bank.questions.length : 0,
      questions: undefined,
    }));

    res.json({
      code: 0,
      data: {
        rows: banks,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
    });
  } catch (error) {
    console.error('List quiz banks error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

async function getQuizBank(req, res) {
  try {
    const { id } = req.params;
    const bank = await QuizBank.findByPk(id);
    if (!bank) {
      return res.status(404).json({ code: 404, error: '题库不存在' });
    }
    res.json({ code: 0, data: bank });
  } catch (error) {
    console.error('Get quiz bank error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

async function createQuizBank(req, res) {
  try {
    const { name, description, isActive } = req.body;
    if (!name) {
      return res.status(400).json({ code: 400, error: '题库名称不能为空' });
    }

    const bank = await QuizBank.create({
      name,
      description,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.json({ code: 0, data: bank });
  } catch (error) {
    console.error('Create quiz bank error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

async function updateQuizBank(req, res) {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const bank = await QuizBank.findByPk(id);
    if (!bank) {
      return res.status(404).json({ code: 404, error: '题库不存在' });
    }

    await bank.update({
      name: name !== undefined ? name : bank.name,
      description: description !== undefined ? description : bank.description,
      isActive: isActive !== undefined ? isActive : bank.isActive,
    });

    res.json({ code: 0, data: bank });
  } catch (error) {
    console.error('Update quiz bank error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

async function deleteQuizBank(req, res) {
  try {
    const { id } = req.params;
    const bank = await QuizBank.findByPk(id);
    if (!bank) {
      return res.status(404).json({ code: 404, error: '题库不存在' });
    }

    await bank.destroy();
    res.json({ code: 0, data: { message: '删除成功' } });
  } catch (error) {
    console.error('Delete quiz bank error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

// Quiz Question CRUD
async function listQuizQuestions(req, res) {
  try {
    const { page = 1, pageSize = 10, quizBankId, type } = req.query;
    const offset = (page - 1) * pageSize;
    const where = {};
    if (quizBankId) where.quizBankId = quizBankId;
    if (type) where.type = type;

    const { count, rows } = await QuizQuestion.findAndCountAll({
      where,
      offset,
      limit: parseInt(pageSize),
      order: [['createdAt', 'DESC']],
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
    console.error('List quiz questions error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

async function getQuizQuestion(req, res) {
  try {
    const { id } = req.params;
    const question = await QuizQuestion.findByPk(id);
    if (!question) {
      return res.status(404).json({ code: 404, error: '题目不存在' });
    }
    res.json({ code: 0, data: question });
  } catch (error) {
    console.error('Get quiz question error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

async function createQuizQuestion(req, res) {
  try {
    const { quizBankId, type, question, options, answer, score } = req.body;
    if (!quizBankId || !type || !question || !answer) {
      return res.status(400).json({ code: 400, error: '缺少必填字段' });
    }

    const newQuestion = await QuizQuestion.create({
      quizBankId,
      type,
      question,
      options: options ? JSON.stringify(options) : null,
      answer,
      score: score || 1,
    });

    res.json({ code: 0, data: newQuestion });
  } catch (error) {
    console.error('Create quiz question error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

async function updateQuizQuestion(req, res) {
  try {
    const { id } = req.params;
    const { quizBankId, type, question, options, answer, score } = req.body;

    const questionData = await QuizQuestion.findByPk(id);
    if (!questionData) {
      return res.status(404).json({ code: 404, error: '题目不存在' });
    }

    await questionData.update({
      quizBankId: quizBankId !== undefined ? quizBankId : questionData.quizBankId,
      type: type !== undefined ? type : questionData.type,
      question: question !== undefined ? question : questionData.question,
      options: options !== undefined ? JSON.stringify(options) : questionData.options,
      answer: answer !== undefined ? answer : questionData.answer,
      score: score !== undefined ? score : questionData.score,
    });

    res.json({ code: 0, data: questionData });
  } catch (error) {
    console.error('Update quiz question error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

async function deleteQuizQuestion(req, res) {
  try {
    const { id } = req.params;
    const question = await QuizQuestion.findByPk(id);
    if (!question) {
      return res.status(404).json({ code: 404, error: '题目不存在' });
    }

    await question.destroy();
    res.json({ code: 0, data: { message: '删除成功' } });
  } catch (error) {
    console.error('Delete quiz question error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

async function importQuizQuestions(req, res) {
  try {
    const { quizBankId, bank_id, questions, rows } = req.body;
    const finalQuizBankId = quizBankId || bank_id;
    const finalQuestions = questions || rows;

    console.log('Import questions data:', { finalQuizBankId, finalQuestions: finalQuestions?.length });

    if (!finalQuizBankId || !Array.isArray(finalQuestions) || finalQuestions.length === 0) {
      return res.status(400).json({ code: 400, error: '缺少必填字段' });
    }

    // Validate and map fields
    const validQuestions = finalQuestions
      .map((q, index) => {
        const type = q.type || q.question_type;
        const question = q.question || q.title;
        const answer = q.answer || q.correct_answer;
        const options = q.options;
        const score = q.score || 1;

        if (!type || !question || !answer) {
          console.error(`Invalid question at index ${index}:`, q);
          return null;
        }

        return {
          quizBankId: finalQuizBankId,
          type,
          question,
          options: options ? JSON.stringify(options) : null,
          answer,
          score,
        };
      })
      .filter((q) => q !== null);

    if (validQuestions.length === 0) {
      return res.status(400).json({ code: 400, error: '没有有效的题目数据' });
    }

    const createdQuestions = await QuizQuestion.bulkCreate(validQuestions);

    res.json({
      code: 0,
      data: {
        imported: createdQuestions.length,
        questions: createdQuestions,
      },
    });
  } catch (error) {
    console.error('Import quiz questions error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

module.exports = {
  // Quiz Bank
  listQuizBanks,
  getQuizBank,
  createQuizBank,
  updateQuizBank,
  deleteQuizBank,
  // Quiz Question
  listQuizQuestions,
  getQuizQuestion,
  createQuizQuestion,
  updateQuizQuestion,
  deleteQuizQuestion,
  importQuizQuestions,
};
