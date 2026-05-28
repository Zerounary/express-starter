const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  listStudentNos,
  getStudentNo,
  createStudentNo,
  updateStudentNo,
  deleteStudentNo,
  importStudentNos,
} = require('../controllers/studentNoController');

router.get('/', authMiddleware, listStudentNos);
router.get('/:id', authMiddleware, getStudentNo);
router.post('/', authMiddleware, createStudentNo);
router.put('/:id', authMiddleware, updateStudentNo);
router.delete('/:id', authMiddleware, deleteStudentNo);
router.post('/import', authMiddleware, importStudentNos);

module.exports = router;
