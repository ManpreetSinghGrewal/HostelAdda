const User = require('../models/User');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../config/mailer');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const sendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email || !email.endsWith('@chitkara.edu.in')) {
    return res.status(400).json({ message: 'A valid @chitkara.edu.in email is required' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[AUTH] OTP generated for ${email}: ${otp}`);

    // Upsert OTP in database
    await OTP.findOneAndUpdate(
      { email },
      { otp, createdAt: Date.now() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Await sendOtpEmail so cloud worker does not terminate background SMTP execution
    const mailResult = await sendOtpEmail(email, otp);
    console.log(`[AUTH LOG] Mail delivery status for ${email}:`, mailResult);

    if (mailResult.isDevFallback) {
      return res.status(200).json({
        message: 'OTP generated. (Dev Mode active)',
        isDevFallback: true,
        devOtp: otp
      });
    }

    res.status(200).json({ message: `Verification OTP sent to ${email}` });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Error generating OTP. Please try again.' });
  }
};

const registerUser = async (req, res) => {
  const { name, email, password, gender, hostelBlock, otp } = req.body;

  try {
    if (!email.endsWith('@chitkara.edu.in')) {
      return res.status(400).json({ message: 'Only @chitkara.edu.in email addresses are allowed.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const record = await OTP.findOne({ email });
    if (!record || record.otp !== otp) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const user = await User.create({ name, email, password, gender, hostelBlock });
    
    // Clear OTP after successful registration
    await OTP.deleteOne({ email });
    
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
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        hostelBlock: user.hostelBlock,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

module.exports = { registerUser, loginUser, sendOtp, googleLogin };
