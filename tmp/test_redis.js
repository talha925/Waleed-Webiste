const redis = require('redis');

async function testRedis() {
  const url = 'redis://default:RDGjxHKSJgzzRhYVJ46gF1UyLyddEYE6@redis-16757.c3.eu-west-1-2.ec2.redns.redis-cloud.com:16757';
  console.log('Connecting to Redis...');

  const client = redis.createClient({ url });
  
  try {
    await client.connect();
    console.log('✅ Connected to Redis!');
    
    const ping = await client.ping();
    console.log(`Ping Response: ${ping}`);

    await client.set('antigravity_test', 'success', { EX: 10 });
    const val = await client.get('antigravity_test');
    console.log(`Test Set/Get: ${val}`);

    await client.quit();
    console.log('✅ Redis working perfectly!');
  } catch (err) {
    console.error('❌ Redis Connection Failed:', err.message);
    process.exit(1);
  }
}

testRedis();
