const mongoose = require('mongoose');

const redactMongoUri = (uri) => {
  if (!uri) return '';
  return uri.replace(/:\S+@/, ':****@');
};

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MongoDB Connection Error: MONGO_URI is not set in environment');
    process.exit(1);
  }

  try {
    const dbName = process.env.MONGO_DB_NAME;
    const connection = await mongoose.connect(mongoUri, dbName ? { dbName } : undefined);
    console.log(`MongoDB Connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    console.error('Connection String:', redactMongoUri(mongoUri));
    if (error.message && /bad auth|authentication failed/i.test(error.message)) {
      console.error('Hint: Check username/password, SRV record, IP allowlist, and dbName.');
      if (!process.env.MONGO_DB_NAME && /mongodb\+srv/i.test(mongoUri)) {
        console.error('Hint: For MongoDB Atlas SRV URIs, set MONGO_DB_NAME to your database.');
      }
    }
    process.exit(1);
  }
};

module.exports = connectDB;