const mongoose = require('mongoose');

// Cache for tenant connections
const tenantConnections = {};

/**
 * Options for MongoDB connection
 * Optimized for multi-tenant pooling
 */
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

/**
 * Get or create a database connection for a specific tenant (brand)
 * @param {string} brandId - Unique identifier for the brand
 * @param {string} uri - MongoDB URI for this brand
 */
const getTenantConnection = async (brandId, uri) => {
  // 1. Check if we already have a healthy connection in cache
  if (tenantConnections[brandId]) {
    const conn = tenantConnections[brandId];
    // 1 = connected, 2 = connecting
    if (conn.readyState === 1 || conn.readyState === 2) {
      return conn;
    }
    // If it's dead, remove it from cache to recreate
    delete tenantConnections[brandId];
  }

  console.log(`🔌 Creating new DB connection for brand: ${brandId}`);

  try {
    // Create a separate connection instance (not the global mongoose connection)
    const conn = await mongoose.createConnection(uri, mongoOptions).asPromise();

    tenantConnections[brandId] = conn;

    // Handle connection events for this specific tenant
    conn.on('error', (err) => {
      console.error(`❌ MongoDB error for brand [${brandId}]:`, err.message);
      // On severe error, remove from cache so next request can try a fresh connection
      if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
        delete tenantConnections[brandId];
      }
    });

    conn.on('disconnected', () => {
      console.warn(`⚠️ MongoDB disconnected for brand [${brandId}]`);
      delete tenantConnections[brandId];
    });

    return conn;
  } catch (error) {
    console.error(`❌ Failed to connect to DB for brand [${brandId}]:`, error.message);
    throw error;
  }
};

/**
 * Graceful shutdown
 */
const closeAllConnections = async () => {
  const brandIds = Object.keys(tenantConnections);
  console.log(`🧹 Closing ${brandIds.length} database connections...`);

  await Promise.all(brandIds.map(async (id) => {
    try {
      await tenantConnections[id].close();
      delete tenantConnections[id];
    } catch (err) {
      console.error(`Error closing connection for ${id}:`, err.message);
    }
  }));
};

// Handle process termination
process.on('SIGINT', async () => {
  await closeAllConnections();
  process.exit(0);
});

module.exports = {
  getTenantConnection,
  closeAllConnections
};
