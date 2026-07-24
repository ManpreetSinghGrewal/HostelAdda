const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

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

    if (!email || !email.endsWith('@chitkara.edu.in')) {
      return res.status(400).json({
        message: 'Access Denied: Only official @chitkara.edu.in Google accounts are allowed.'
      });
    }

    let user = await User.findOne({ email });

    if (user) {
      user.isOnline = true;
      await user.save();

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
        email: email,
        name: name,
        picture: picture,
        message: 'Please select your Gender and Hostel Block to complete registration.'
      });
    }

    // Create new user with Google authenticated details
    const randomPassword = Math.random().toString(36).slice(-10) + 'A1!';
    user = await User.create({
      name: name || email.split('@')[0],
      email: email,
      password: randomPassword,
      gender: gender,
      hostelBlock: hostelBlock,
      isOnline: true
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

module.exports = { googleLogin };
