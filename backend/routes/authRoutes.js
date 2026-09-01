const express = require('express');
const router = express.Router();
const {
  sendOTP,
  verifyOTPAndRegister,
  registerUser,
  loginUser,
  googleLogin
} = require('../controllers/authController');

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTPAndRegister);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);

module.exports = router;
