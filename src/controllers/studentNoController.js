const { StudentNo } = require('../models');

async function listStudentNos(req, res) {
  try {
    const { page = 1, pageSize = 10, className, grade, studentNo } = req.query;
    const offset = (page - 1) * pageSize;
    const where = {};
    if (className) where.className = className;
    if (grade) where.grade = grade;
    if (studentNo) where.studentNo = { [require('sequelize').Op.like]: `%${studentNo}%` };

    const { count, rows } = await StudentNo.findAndCountAll({
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
    console.error('List student nos error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

async function getStudentNo(req, res) {
  try {
    const { id } = req.params;
    const studentNo = await StudentNo.findByPk(id);
    if (!studentNo) {
      return res.status(404).json({ code: 404, error: '学号不存在' });
    }
    res.json({ code: 0, data: studentNo });
  } catch (error) {
    console.error('Get student no error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

async function createStudentNo(req, res) {
  try {
    const { studentNo, realName, className, grade } = req.body;
    if (!studentNo || !realName) {
      return res.status(400).json({ code: 400, error: '学号和姓名不能为空' });
    }

    const newStudentNo = await StudentNo.create({
      studentNo,
      realName,
      className,
      grade,
    });

    res.json({ code: 0, data: newStudentNo });
  } catch (error) {
    console.error('Create student no error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ code: 400, error: '学号已存在' });
    }
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

async function updateStudentNo(req, res) {
  try {
    const { id } = req.params;
    const { studentNo, realName, className, grade } = req.body;

    const studentNoData = await StudentNo.findByPk(id);
    if (!studentNoData) {
      return res.status(404).json({ code: 404, error: '学号不存在' });
    }

    await studentNoData.update({
      studentNo: studentNo !== undefined ? studentNo : studentNoData.studentNo,
      realName: realName !== undefined ? realName : studentNoData.realName,
      className: className !== undefined ? className : studentNoData.className,
      grade: grade !== undefined ? grade : studentNoData.grade,
    });

    res.json({ code: 0, data: studentNoData });
  } catch (error) {
    console.error('Update student no error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ code: 400, error: '学号已存在' });
    }
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

async function deleteStudentNo(req, res) {
  try {
    const { id } = req.params;
    const studentNo = await StudentNo.findByPk(id);
    if (!studentNo) {
      return res.status(404).json({ code: 404, error: '学号不存在' });
    }

    await studentNo.destroy();
    res.json({ code: 0, data: { message: '删除成功' } });
  } catch (error) {
    console.error('Delete student no error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

async function importStudentNos(req, res) {
  try {
    const { studentNos } = req.body;
    if (!Array.isArray(studentNos) || studentNos.length === 0) {
      return res.status(400).json({ code: 400, error: '缺少必填字段' });
    }

    const createdStudentNos = await StudentNo.bulkCreate(
      studentNos.map((s) => ({
        studentNo: s.studentNo,
        realName: s.realName,
        className: s.className || null,
        grade: s.grade || null,
      })),
      { ignoreDuplicates: true }
    );

    res.json({
      code: 0,
      data: {
        imported: createdStudentNos.length,
        studentNos: createdStudentNos,
      },
    });
  } catch (error) {
    console.error('Import student nos error:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
}

module.exports = {
  listStudentNos,
  getStudentNo,
  createStudentNo,
  updateStudentNo,
  deleteStudentNo,
  importStudentNos,
};
