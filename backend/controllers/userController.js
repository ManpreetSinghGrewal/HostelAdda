const User = require('../models/User');

const getOnlineUsers = async (req, res) => {
  try {
    const users = await User.find({ isOnline: true }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOnlineCount = async (req, res) => {
  try {
    const totalCount = await User.countDocuments({ isOnline: true });
    const maleCount = await User.countDocuments({ isOnline: true, gender: 'Male' });
    const femaleCount = await User.countDocuments({ isOnline: true, gender: 'Female' });
    const othersCount = await User.countDocuments({ isOnline: true, gender: 'Others' });
    res.json({ count: totalCount, maleCount, femaleCount, othersCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFriends = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .populate('friends', 'name isOnline hostelBlock')
      .populate('friendRequests', 'name hostelBlock');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ friends: user.friends, friendRequests: user.friendRequests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendFriendRequest = async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;
    if (fromUserId === toUserId) return res.status(400).json({ message: 'Cannot add yourself' });

    const toUser = await User.findById(toUserId);
    if (!toUser) return res.status(404).json({ message: 'User not found' });

    if (toUser.friends.includes(fromUserId)) {
      return res.status(400).json({ message: 'Already friends' });
    }
    if (toUser.friendRequests.includes(fromUserId)) {
      return res.status(400).json({ message: 'Request already sent' });
    }

    toUser.friendRequests.push(fromUserId);
    await toUser.save();
    
    res.json({ message: 'Friend request sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const acceptFriendRequest = async (req, res) => {
  try {
    const { userId, fromUserId } = req.body;

    const user = await User.findById(userId);
    const fromUser = await User.findById(fromUserId);

    if (!user || !fromUser) return res.status(404).json({ message: 'User not found' });

    if (!user.friendRequests.includes(fromUserId)) {
      return res.status(400).json({ message: 'No request found' });
    }

    // Remove from requests, add to friends
    user.friendRequests = user.friendRequests.filter(id => id.toString() !== fromUserId.toString());
    if (!user.friends.includes(fromUserId)) user.friends.push(fromUserId);
    
    // Add to other person's friends
    if (!fromUser.friends.includes(userId)) fromUser.friends.push(userId);

    await user.save();
    await fromUser.save();

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, hostelBlock } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (name) user.name = name;
    if (hostelBlock) user.hostelBlock = hostelBlock;
    
    await user.save();
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      hostelBlock: user.hostelBlock,
      token: req.headers.authorization?.split(' ')[1] // usually frontend handles token, this is just info
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getOnlineUsers, getOnlineCount, getFriends, sendFriendRequest, acceptFriendRequest, updateProfile };
