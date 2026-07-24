const express = require('express');
const router = express.Router();
const { registerUser, loginUser, sendOtp, googleLogin } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/send-otp', sendOtp);
router.post('/google', googleLogin);

module.exports = router;
