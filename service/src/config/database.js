const mongoose = require('mongoose');
const config = require('./index');

class Database {
  constructor() {
    this.mongoose = mongoose;
  }

  async connect() {
    try {
      await mongoose.connect(config.database.url);

      console.log('📊 Database connected successfully');
      console.log(`📊 Database: ${config.database.name}`);

      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('📊 Database connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('📊 Database disconnected');
      });

    } catch (error) {
      console.error('📊 Failed to connect to database:', error.message);
      throw error;
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      console.log('📊 Database disconnected gracefully');
    } catch (error) {
      console.error('📊 Error disconnecting from database:', error);
    }
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }
}

module.exports = new Database();

