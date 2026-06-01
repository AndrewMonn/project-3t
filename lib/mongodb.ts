// @docs: DNS servers (1.1.1.1 + 8.8.8.8) for Atlas SRV resolution
// @docs: Auto-retry on first connection failure (Node.js DNS cold-start quirk)
import mongoose from 'mongoose';
import dns from 'node:dns';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/comuna_una_sola_fuerza';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

function ensureDNSServers(): void {
  dns.setServers(['1.1.1.1', '8.8.8.8']);
  dns.setDefaultResultOrder('ipv4first');
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  ensureDNSServers();
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    })
      .then((mongoose) => { console.log('MongoDB conectado'); return mongoose; });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    ensureDNSServers();
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    })
      .then((mongoose) => { console.log('MongoDB conectado'); return mongoose; });
    try {
      cached.conn = await cached.promise;
    } catch (e2) {
      cached.promise = null;
      throw e2;
    }
  }
  return cached.conn;
}

export default connectDB;
