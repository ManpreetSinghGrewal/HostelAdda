const Room = require('../models/Room');
const Message = require('../models/Message');

// Initial Chitkara Hostel Rooms for database seeding
const initialRooms = [
  {
    roomId: 'franklin-lounge',
    name: 'Franklin Block Lounge',
    description: 'Franklin Hostel A & B student hub. Casual hangout and tech discussions.',
    category: 'hostel'
  },
  {
    roomId: 'ngh-girls-hub',
    name: 'NGH Girls Hub',
    description: 'Exclusive lounge for NGH Hostel A & B students. Peer chat & study.',
    category: 'hostel'
  },
  {
    roomId: 'gaming-esports',
    name: 'Gaming & Esports Lounge',
    description: 'Valorant, BGMI, GTA, and multiplayer gaming matchmaking for Chitkara hostels.',
    category: 'gaming'
  },
  {
    roomId: 'late-night-study',
    name: 'Late Night Study & Code',
    description: 'Quiet study, exam revision, assignment collaboration, and coding help.',
    category: 'study'
  }
];

const getRooms = async (req, res) => {
  try {
    const io = req.app.get('io');
    let rooms = await Room.find({});
    
    // Auto-seed database if empty
    if (rooms.length === 0) {
      await Room.insertMany(initialRooms);
      rooms = await Room.find({});
    }

    const roomsWithCounts = rooms.map(room => {
      const roomObj = room.toObject();
      const activeCount = io?.sockets?.adapter?.rooms?.get(roomObj.roomId)?.size || 0;
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
