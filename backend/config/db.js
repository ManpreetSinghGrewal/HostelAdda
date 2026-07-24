const mongoose = require('mongoose');

const DEFAULT_MONGO_URI = 'mongodb+srv://manpreetsgrewal5911_db_user:n6Xk0OVDbjmr5Nvq@cluster0.olwdkon.mongodb.net/chitmeet';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || DEFAULT_MONGO_URI;
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Do not call process.exit(1) to avoid 502 Bad Gateway on server hosts
  }
};

module.exports = connectDB;
