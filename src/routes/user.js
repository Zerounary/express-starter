const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

router.get('/', authMiddleware, listUsers);
router.get('/:id', authMiddleware, getUser);
router.post('/', authMiddleware, createUser);
router.put('/:id', authMiddleware, updateUser);
router.delete('/:id', authMiddleware, deleteUser);

module.exports = router;
