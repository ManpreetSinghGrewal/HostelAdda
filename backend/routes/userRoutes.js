const express = require('express');
const router = express.Router();
const { getOnlineUsers } = require('../controllers/userController');

router.get('/online', getOnlineUsers);

module.exports = router;
