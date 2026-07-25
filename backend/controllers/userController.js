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
    const onlineUsers = await User.find({ isOnline: true });
    let maleCount = onlineUsers.filter(u => u.gender === 'Male').length;
    let femaleCount = onlineUsers.filter(u => u.gender === 'Female').length;
    let othersCount = onlineUsers.filter(u => u.gender === 'Others').length;
    let knownCount = maleCount + femaleCount + othersCount;

    const io = req.app.get('io');
    const activeSockets = io ? io.sockets.sockets.size : 0;
    const totalCount = Math.max(knownCount, activeSockets);
    const unassigned = totalCount - knownCount;

    if (unassigned > 0) {
      maleCount += unassigned;
    }

    res.json({
      count: totalCount,
      maleCount,
      femaleCount,
      othersCount
    });
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

    user.friendRequests = user.friendRequests.filter(id => id.toString() !== fromUserId.toString());
    if (!user.friends.includes(fromUserId)) user.friends.push(fromUserId);
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
      token: req.headers.authorization?.split(' ')[1]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getOnlineUsers, getOnlineCount, getFriends, sendFriendRequest, acceptFriendRequest, updateProfile };
