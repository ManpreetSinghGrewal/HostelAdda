const User = require('../models/User');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Lazily initialize transporter to ensure process.env is fully loaded
let transporter;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

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
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[DEBUG] OTP generated for ${email}: ${otp}`);

    // Upsert OTP in database
    await OTP.findOneAndUpdate(
      { email },
      { otp, createdAt: Date.now() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'HostelAdda Registration OTP',
      text: `Your OTP for HostelAdda registration is: ${otp}\nThis OTP is valid for 5 minutes.`,
    };

    // Send email using the cached transporter and await it to ensure delivery
    await getTransporter().sendMail(mailOptions);

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Error sending OTP. Please ensure email credentials are set in the backend.' });
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

module.exports = { registerUser, loginUser, sendOtp };
