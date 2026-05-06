const Room = require('../models/Room');
const Message = require('../models/Message');

const getRooms = async (req, res) => {
  try {
    const io = req.app.get('io');
    const rooms = await Room.find({});
    
    const roomsWithCounts = rooms.map(room => {
      const roomObj = room.toObject();
      const activeCount = io.sockets.adapter.rooms.get(roomObj.roomId)?.size || 0;
      return { ...roomObj, activeUsers: activeCount };
    });

    res.json(roomsWithCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRoomMessages = async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getRooms, getRoomMessages };
