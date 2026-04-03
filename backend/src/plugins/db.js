import mongoose from 'mongoose';

const dbPlugin = {
  name: 'db',
  version: '1.0.0',
  async register(server) {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI env var is required');

    await mongoose.connect(uri);
    console.log('MongoDB connected');

    server.ext('onPreStop', async () => {
      await mongoose.disconnect();
      console.log('MongoDB disconnected');
    });
  },
};

export default dbPlugin;
