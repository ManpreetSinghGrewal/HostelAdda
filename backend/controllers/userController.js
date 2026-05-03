const User = require('../models/User');

const getOnlineUsers = async (req, res) => {
  try {
    const users = await User.find({ isOnline: true }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getOnlineUsers };
