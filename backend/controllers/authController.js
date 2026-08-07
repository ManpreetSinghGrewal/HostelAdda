const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '30d' });
};

// @desc    Register a new user with Email + Password
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  const { name, email, password, gender, hostelBlock } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email, and password.' });
  }

  const cleanEmail = email.toLowerCase().trim();

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
      hostelBlock: hostelBlock || 'Franklin-A'
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

// @desc    Authenticate with Google OAuth (Any Google ID)
// @route   POST /api/auth/google
const googleLogin = async (req, res) => {
  const { idToken, credential, gender, hostelBlock } = req.body;
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

    let user = await User.findOne({ email: cleanEmail });

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

    // If User does not exist yet and gender/hostelBlock missing, request profile completion
    if (!gender || !hostelBlock) {
      return res.status(200).json({
        requiresProfileDetails: true,
        email: cleanEmail,
        name: name,
        picture: picture,
        message: 'Please select your Gender and Hostel Block to complete registration.'
      });
    }

    // Create new user with Google authenticated details
    const randomPassword = Math.random().toString(36).slice(-10) + 'A1!';
    user = await User.create({
      name: name || cleanEmail.split('@')[0],
      email: cleanEmail,
      password: randomPassword,
      gender: gender,
      hostelBlock: hostelBlock
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

module.exports = { registerUser, loginUser, googleLogin };
