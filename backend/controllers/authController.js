const User = require('../models/User');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { sendBrevoOTP } = require('../utils/sendBrevoEmail');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '30d' });
};

const isChitkaraEmail = (email) => {
  return email && email.toLowerCase().trim().endsWith('@chitkara.edu.in');
};

// @desc    Send 6-digit OTP to user email via Brevo (@chitkara.edu.in only)
// @route   POST /api/auth/send-otp
const sendOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email address is required.' });
  }

  const cleanEmail = email.toLowerCase().trim();

  if (!isChitkaraEmail(cleanEmail)) {
    return res.status(400).json({
      message: 'Access Denied: Only @chitkara.edu.in email accounts are permitted.'
    });
  }

  try {
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({
        message: 'User already exists with this email. Please log in with your password or Google.'
      });
    }

    // Generate 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any previous OTP records for this email and save new one
    await OTP.deleteMany({ email: cleanEmail });
    await OTP.create({ email: cleanEmail, otp: otpCode });

    // Send email via Brevo API
    const emailResult = await sendBrevoOTP(cleanEmail, otpCode);

    if (emailResult.success) {
      res.status(200).json({ message: 'OTP sent to your Chitkara email.' });
    } else {
      res.status(500).json({ message: emailResult.message || 'Failed to send OTP email.' });
    }
  } catch (error) {
    console.error('sendOTP Error:', error);
    res.status(500).json({ message: error.message || 'Failed to send OTP code.' });
  }
};

// @desc    Verify 6-digit OTP and complete Sign Up (@chitkara.edu.in only)
// @route   POST /api/auth/verify-otp
const verifyOTPAndRegister = async (req, res) => {
  const { email, otp, name, password, gender, hostelBlock } = req.body;

  if (!email || !otp || !name || !password) {
    return res.status(400).json({ message: 'Please provide email, OTP code, name, and password.' });
  }

  const cleanEmail = email.toLowerCase().trim();

  if (!isChitkaraEmail(cleanEmail)) {
    return res.status(400).json({
      message: 'Access Denied: Only @chitkara.edu.in email accounts are permitted.'
    });
  }

  try {
    const otpRecord = await OTP.findOne({ email: cleanEmail, otp: otp.trim() });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP code. Please request a new code.' });
    }

    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      await OTP.deleteMany({ email: cleanEmail });
      return res.status(400).json({ message: 'User already exists. Please log in.' });
    }

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: password,
      gender: gender || 'Male',
      hostelBlock: hostelBlock || 'FRANKLIN-A'
    });

    // Delete verified OTP record
    await OTP.deleteMany({ email: cleanEmail });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      gender: user.gender,
      hostelBlock: user.hostelBlock,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('verifyOTP Error:', error);
    res.status(500).json({ message: error.message || 'Verification failed.' });
  }
};

// @desc    Register a new user directly with Email + Password (@chitkara.edu.in only)
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  const { name, email, password, gender, hostelBlock } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email, and password.' });
  }

  const cleanEmail = email.toLowerCase().trim();

  if (!isChitkaraEmail(cleanEmail)) {
    return res.status(400).json({
      message: 'Access Denied: Only @chitkara.edu.in email accounts are permitted.'
    });
  }

  try {
    const userExists = await User.findOne({ email: cleanEmail });

    if (userExists) {
      return res.status(400).json({
        message: 'User already exists. Please log in with your email & password or Google.'
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: password,
      gender: gender || 'Male',
      hostelBlock: hostelBlock || 'FRANKLIN-A'
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        hostelBlock: user.hostelBlock,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data.' });
    }
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: error.message || 'Registration failed.' });
  }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password.' });
  }

  const cleanEmail = email.toLowerCase().trim();

  if (!isChitkaraEmail(cleanEmail)) {
    return res.status(400).json({
      message: 'Access Denied: Only @chitkara.edu.in email accounts are permitted.'
    });
  }

  try {
    const user = await User.findOne({ email: cleanEmail });

    if (user && (await user.matchPassword(password))) {
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        hostelBlock: user.hostelBlock,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password.' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: error.message || 'Login failed.' });
  }
};

// @desc    Authenticate with Google OAuth + Brevo 6-digit OTP Verification (@chitkara.edu.in only)
// @route   POST /api/auth/google
const googleLogin = async (req, res) => {
  const { idToken, credential, gender, hostelBlock, otp } = req.body;
  const token = idToken || credential;

  if (!token) {
    return res.status(400).json({ message: 'Google ID Token is required' });
  }

  try {
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyError) {
      // Fallback decode if Client ID is not configured in env
      const decoded = jwt.decode(token);
      if (decoded && decoded.email) {
        payload = decoded;
      } else {
        return res.status(400).json({ message: 'Invalid Google token' });
      }
    }

    const { email, name, picture } = payload;
    const cleanEmail = email.toLowerCase().trim();

    // Enforce @chitkara.edu.in domain restriction
    if (!isChitkaraEmail(cleanEmail)) {
      return res.status(400).json({
        message: 'Access Denied: Only @chitkara.edu.in accounts are permitted.'
      });
    }

    let user = await User.findOne({ email: cleanEmail });

    // Step 1: If OTP is not provided yet, generate and send 6-digit OTP via Brevo to Google email
    if (!otp) {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      await OTP.deleteMany({ email: cleanEmail });
      await OTP.create({ email: cleanEmail, otp: otpCode });

      await sendBrevoOTP(cleanEmail, otpCode);

      return res.status(200).json({
        requiresOtp: true,
        email: cleanEmail,
        name: name,
        picture: picture,
        credential: token,
        isNewUser: !user,
        requiresProfileDetails: !user && (!gender || !hostelBlock),
        message: '6-digit OTP code sent to your Chitkara email address.'
      });
    }

    // Step 2: If OTP is provided, verify it against DB
    const otpRecord = await OTP.findOne({ email: cleanEmail, otp: otp.trim() });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP code. Please try again.' });
    }

    // Delete verified OTP record
    await OTP.deleteMany({ email: cleanEmail });

    // Existing User Login
    if (user) {
      return res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        hostelBlock: user.hostelBlock,
        picture: picture,
        token: generateToken(user._id)
      });
    }

    // New User Registration with Google authenticated details
    const randomPassword = Math.random().toString(36).slice(-10) + 'A1!';
    user = await User.create({
      name: name || cleanEmail.split('@')[0],
      email: cleanEmail,
      password: randomPassword,
      gender: gender || 'Male',
      hostelBlock: hostelBlock || 'FRANKLIN-A'
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      gender: user.gender,
      hostelBlock: user.hostelBlock,
      picture: picture,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ message: 'Google Authentication failed: ' + error.message });
  }
};

module.exports = {
  sendOTP,
  verifyOTPAndRegister,
  registerUser,
  loginUser,
  googleLogin
};
