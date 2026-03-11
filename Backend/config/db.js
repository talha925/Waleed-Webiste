const mongoose = require('mongoose');

// Cache for tenant connections
const tenantConnections = {};

// Central connection for Users and Activity Logs
let centralConnection = null;

const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 60000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000,
  family: 4,
};

const getCentralConnection = async () => {
  if (centralConnection && (centralConnection.readyState === 1 || centralConnection.readyState === 2)) {
    return centralConnection;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('❌ MONGO_URI is missing in deployment environment variables. Central connection cannot be established.');
  }

  console.log('🔌 Connecting to Central Database...');
  try {
    centralConnection = mongoose.createConnection(uri, mongoOptions);
    await centralConnection.asPromise();
    console.log('✅ Central Database Connected.');

    centralConnection.on('error', (err) => {
      console.error('❌ Central MongoDB Error:', err.message);
    });

    return centralConnection;
  } catch (error) {
    console.error('❌ Failed to connect to Central Database:', error.message);
    throw error;
  }
};

/**
 * Get or create a database connection for a specific tenant (brand)
 */
const getTenantConnection = async (brandId, uri) => {
  if (tenantConnections[brandId]) {
    const conn = tenantConnections[brandId];
    if (conn.readyState === 1 || conn.readyState === 2) {
      return conn;
    }
    if (conn.readyState === 0) {
      console.log(`ℹ️ Connection [${brandId}] is disconnected, awaiting auto-reconnect...`);
    }
    return conn;
  }

  console.log(`🔌 Creating new DB connection for brand: ${brandId}`);

  try {
    const conn = mongoose.createConnection(uri, mongoOptions);
    tenantConnections[brandId] = conn;

    await Promise.race([
      conn.asPromise(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database connection timed out (60s).')), 60000))
    ]);

    console.log(`✅ DB connected for [${brandId}]`);

    conn.on('error', (err) => {
      console.error(`❌ MongoDB error for brand [${brandId}]:`, err.message);
    });

    return conn;
  } catch (error) {
    console.error(`❌ Failed to connect to DB for brand [${brandId}]:`, error.message);
    delete tenantConnections[brandId];
    throw error;
  }
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
