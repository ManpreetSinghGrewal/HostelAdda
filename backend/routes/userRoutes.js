const express = require('express');
const router = express.Router();
const {
  getOnlineUsers,
  getOnlineCount,
  getFriends,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  updateProfile
} = require('../controllers/userController');

router.get('/online', getOnlineUsers);
router.get('/online-count', getOnlineCount);
router.get('/:userId/friends', getFriends);
router.put('/:userId/profile', updateProfile);
router.post('/friend-request', sendFriendRequest);
router.post('/friend-request/accept', acceptFriendRequest);
router.post('/friend-request/decline', declineFriendRequest);

module.exports = router;
