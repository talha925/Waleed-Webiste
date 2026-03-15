const redis = require('redis');

async function testRedis() {
    console.log('Testing Redis connection...');
    const client = redis.createClient({
        url: 'redis://default:RDGjxHKSJgzzRhYVJ46gF1UyLyddEYE6@redis-16757.c3.eu-west-1-2.ec2.redns.redis-cloud.com:16757'
    });

    client.on('error', (err) => console.log('Redis Client Error', err));

    try {
        await client.connect();
        console.log('✅ Connected successfully!');
        await client.quit();
    } catch(e) {
        console.error('❌ Connection failed:', e.message);
    }
}

testRedis();
