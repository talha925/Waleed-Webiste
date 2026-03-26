const mongoose = require('mongoose');
const dns = require('node:dns');
const dotenv = require('dotenv');
const path = require('path');

// Load env from Backend
dotenv.config({ path: 'c:/Users/HP/Desktop/waleed website/Backend/.env' });

console.log('--- DB Connection Test ---');

// Replicate Backend/app.js settings
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}
/*
try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
    console.warn('⚠️ Could not set custom DNS servers');
}
*/

const uri = process.env.BLOGZENIX_MONGO_URI;
console.log('Target URI:', uri?.substring(0, 30) + '...');

const start = Date.now();
async function test() {
    try {
        console.log('Starting connection...');
        const conn = mongoose.createConnection(uri, {
            serverSelectionTimeoutMS: 10000, // 10s for test
            family: 4
        });
        await conn.asPromise();
        console.log('✅ Connected in', (Date.now() - start) / 1000, 'seconds');
        await conn.close();
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        console.log('DNS lookup test...');
        try {
            const host = uri.match(/@([^/]+)/)[1];
            console.log('Resolving host:', host);
            const lookupStart = Date.now();
            dns.lookup(host, { family: 4 }, (err, address) => {
                if (err) console.error('DNS Lookup Error:', err);
                else console.log('Resolved to:', address, 'in', (Date.now() - lookupStart) / 1000, 's');
            });
        } catch (e) {}
    }
}

test();
