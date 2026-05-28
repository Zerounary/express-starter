const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  listQuizBanks,
  getQuizBank,
  createQuizBank,
  updateQuizBank,
  deleteQuizBank,
  listQuizQuestions,
  getQuizQuestion,
  createQuizQuestion,
  updateQuizQuestion,
  deleteQuizQuestion,
  importQuizQuestions,
} = require('../controllers/quizController');
const {
  listQuizActivities,
  getQuizActivity,
  createQuizActivity,
  updateQuizActivity,
  deleteQuizActivity,
} = require('../controllers/activityController');
const { getQuizActivityStats } = require('../controllers/statsController');

// Quiz Bank routes
router.get('/banks', authMiddleware, listQuizBanks);
router.get('/banks/:id', authMiddleware, getQuizBank);
router.post('/banks', authMiddleware, createQuizBank);
router.put('/banks/:id', authMiddleware, updateQuizBank);
router.delete('/banks/:id', authMiddleware, deleteQuizBank);

// Quiz Question routes
router.get('/questions', authMiddleware, listQuizQuestions);
router.get('/questions/:id', authMiddleware, getQuizQuestion);
router.post('/questions', authMiddleware, createQuizQuestion);
router.put('/questions/:id', authMiddleware, updateQuizQuestion);
router.delete('/questions/:id', authMiddleware, deleteQuizQuestion);
router.post('/questions/import', authMiddleware, importQuizQuestions);

// Quiz Activity routes
router.get('/activities', authMiddleware, listQuizActivities);
router.get('/activities/:id', authMiddleware, getQuizActivity);
router.post('/activities', authMiddleware, createQuizActivity);
router.put('/activities/:id', authMiddleware, updateQuizActivity);
router.delete('/activities/:id', authMiddleware, deleteQuizActivity);

// Quiz Activity Stats routes
router.get('/activities/:id/stats', authMiddleware, getQuizActivityStats);

module.exports = router;
