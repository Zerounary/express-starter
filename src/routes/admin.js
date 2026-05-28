const express = require('express');
const router = express.Router();
const { createTrial } = require('../controllers/adminController');

router.post('/trial', createTrial);

module.exports = router;
