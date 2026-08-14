const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');

async function connectDB() {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connected');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error: %s', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  await mongoose.connect(env.MONGODB_URI);

  return mongoose.connection;
}

module.exports = connectDB;
