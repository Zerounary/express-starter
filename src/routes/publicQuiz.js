const express = require('express');
const router = express.Router();
const { publicTokenMiddleware } = require('../middleware/publicAuth');
const {
  getActivity,
  checkStudentNo,
  login,
  submitProgress,
  getResult,
} = require('../controllers/publicQuizController');

router.get('/activity', publicTokenMiddleware, getActivity);
router.post('/check-student-no', publicTokenMiddleware, checkStudentNo);
router.post('/login', publicTokenMiddleware, login);
router.post('/progress', publicTokenMiddleware, submitProgress);
router.get('/result/:participantId', publicTokenMiddleware, getResult);

module.exports = router;
