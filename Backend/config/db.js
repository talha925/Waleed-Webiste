const mongoose = require('mongoose');

// Cache for tenant connections
const tenantConnections = {};

const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 60000, // Windows SRV lookup can take 40s+
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000,
  family: 4,
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
    // If state is disconnected (0), we keep the object to let it auto-reconnect
    // unless it's manually being recreated
    if (conn.readyState === 0) {
      console.log(`ℹ️ Connection [${brandId}] is disconnected, awaiting auto-reconnect...`);
    }
    return conn;
  }

  console.log(`🔌 Creating new DB connection for brand: ${brandId}`);

  try {
    const conn = mongoose.createConnection(uri, mongoOptions);
    tenantConnections[brandId] = conn;

    // Use a timeout for the initial connection so we don't hang forever
    await Promise.race([
      conn.asPromise(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database connection timed out (60s). Please check your internet or DNS.')), 60000))
    ]);

    console.log(`✅ DB connected for [${brandId}]`);

    conn.on('error', (err) => {
      console.error(`❌ MongoDB error for brand [${brandId}]:`, err.message);
    });

    conn.on('disconnected', () => {
      console.warn(`⚠️ MongoDB disconnected for brand [${brandId}] (Auto-reconnecting...)`);
    });

    conn.on('reconnected', () => {
      console.log(`✅ MongoDB reconnected for brand [${brandId}]`);
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
  await Promise.all(brandIds.map(async (id) => {
    try {
      await tenantConnections[id].close();
      delete tenantConnections[id];
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
  closeAllConnections,
  warmupConnection
};
