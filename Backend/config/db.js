const mongoose = require('mongoose');

// Cache for tenant connections
const tenantConnections = {};

// Central connection for Users and Activity Logs
let centralConnection = null;

const mongoOptions = {
  maxPoolSize: 3,                  // 🔥 FIX: Serverless needs small pools (was 20, causing thundering herd)
  minPoolSize: 1,                  // Keep at least 1 connection alive
  serverSelectionTimeoutMS: 10000, // 🔥 FIX: Fail fast (was 20s)
  socketTimeoutMS: 20000,          // 🔥 FIX: Reduced from 45s
  connectTimeoutMS: 10000,         // 🔥 FIX: Reduced from 20s
  heartbeatFrequencyMS: 30000,     // 🔥 FIX: Less frequent heartbeats to reduce overhead (was 10s)
  autoIndex: process.env.NODE_ENV === 'development',
  maxIdleTimeMS: 60000,            // Close idle connections after 60s to free resources
};

// Map of brandId -> Promise<Connection>
const connectionPromises = {};
// Central connection promise
let centralConnectionPromise = null;

const getCentralConnection = async () => {
  if (centralConnection && centralConnection.readyState === 1) {
    return centralConnection;
  }

  // If already connecting, return existing promise
  if (centralConnectionPromise) {
    return centralConnectionPromise;
  }

  const uri = process.env.BLOGZENIX_MONGO_URI || process.env.MONGO_URI;
  if (!uri) {
    throw new Error('❌ MONGO_URI or BLOGZENIX_MONGO_URI is missing. Central connection cannot be established.');
  }

  console.log('🔌 Connecting to Central Database...');
  centralConnectionPromise = (async () => {
    try {
      centralConnection = mongoose.createConnection(uri, mongoOptions);
      await centralConnection.asPromise();
      console.log('✅ Central Database Connected.');

      centralConnection.on('error', (err) => {
        console.error('❌ Central MongoDB Error:', err.message);
        centralConnectionPromise = null; // Allow retry on fatal error
      });

      return centralConnection;
    } catch (error) {
      console.error('❌ Failed to connect to Central Database:', error.message);
      centralConnectionPromise = null;
      throw error;
    }
  })();

  return centralConnectionPromise;
};

/**
 * Get or create a database connection for a specific tenant (brand)
 * Uses a promise cache to prevent "Double Connection" races
 */
const getTenantConnection = async (brandId, uri) => {
  // 1. If we have an active connection, return it immediately
  if (tenantConnections[brandId] && tenantConnections[brandId].readyState === 1) {
    return tenantConnections[brandId];
  }

  // 2. If we are currently connecting, wait for THAT specific promise
  if (connectionPromises[brandId]) {
    return connectionPromises[brandId];
  }

  console.log(`🔌 Creating new DB connection for brand: ${brandId}`);
  
  // 3. Create the connection promise
  connectionPromises[brandId] = (async () => {
    try {
      const conn = mongoose.createConnection(uri, mongoOptions);
      tenantConnections[brandId] = conn;

      await Promise.race([
        conn.asPromise(),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Database connection timed out (15s) for ${brandId}.`)), 15000))
      ]);

      console.log(`✅ DB connected for [${brandId}]`);

      conn.on('error', (err) => {
        console.error(`❌ MongoDB error for brand [${brandId}]:`, err.message);
        // If connection dies, clear it so next request re-establishes
        if (conn.readyState === 0) {
          delete tenantConnections[brandId];
          delete connectionPromises[brandId];
        }
      });

      return conn;
    } catch (error) {
      console.error(`❌ Failed to connect to DB for brand [${brandId}]:`, error.message);
      delete tenantConnections[brandId];
      delete connectionPromises[brandId];
      throw error;
    }
  })();

  return connectionPromises[brandId];
};

const warmupConnection = async (brandId, uri) => {
  try {
    console.log(`🔥 Pre-warming DB connection for [${brandId}]...`);
    getTenantConnection(brandId, uri).catch(err => {
      console.log(`⚠️ Warmup background error: ${err.message}`);
    });
  } catch (error) {
    console.error(`⚠️ Pre-warm setup failed:`, error.message);
  }
};

const closeAllConnections = async () => {
  const brandIds = Object.keys(tenantConnections);
  if (centralConnection) {
    brandIds.push('central');
    tenantConnections['central'] = centralConnection;
  }

  await Promise.all(brandIds.map(async (id) => {
    try {
      if (tenantConnections[id]) {
        await tenantConnections[id].close();
        delete tenantConnections[id];
      }
    } catch (err) {
      console.error(`Error closing connection:`, err.message);
    }
  }));
};

process.on('SIGINT', async () => {
  await closeAllConnections();
  process.exit(0);
});

module.exports = {
  getTenantConnection,
  getCentralConnection,
  closeAllConnections,
  warmupConnection
};
