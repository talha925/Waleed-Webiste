// lib/websocket-server.js - Real-time WebSocket Server with Redis Pub/Sub
const WebSocket = require('ws');
const http = require('http');
const redisConfig = require('../config/redis');

class WebSocketServer {
    constructor() {
        this.wss = null;
        this.server = null;
        this.redisSubscriber = null;
        this.redisPublisher = null;
        this.isEnabled = process.env.WS_ENABLED === 'true';
        this.port = process.env.WS_PORT || 8080;
        this.connections = new Set();
        this.stats = { totalConnections: 0, activeConnections: 0, messagesPublished: 0, messagesReceived: 0, startTime: new Date() };
        this.pubSubRetryAttempts = 0;
        this.maxPubSubRetries = 5;
    }

    async initialize(server = null) {
        if (!this.isEnabled) return;
        try {
            await this.setupRedisSubscriber();
            this.setupWebSocketServer(server);
            console.log('✅ WebSocket server initialized successfully');
        } catch (error) {
            console.error('❌ WebSocket server initialization failed:', error);
        }
    }

    async setupRedisSubscriber() {
        if (!redisConfig.isReady()) {
            console.warn('⚠️ Redis not ready for WebSocket Pub/Sub. Will retry when Redis connects...');
            this._retryPubSubConnection();
            return;
        }
        try {
            this.redisSubscriber = redisConfig.getClient().duplicate();
            this.redisPublisher = redisConfig.getClient().duplicate();
            await this.redisSubscriber.connect();
            await this.redisPublisher.connect();

            await this.redisSubscriber.subscribe('tenant_updates', (message) => {
                this.handleRedisMessage('tenant_updates', message);
            });
            this.pubSubRetryAttempts = 0; // Reset on success
            console.log('✅ Redis Pub/Sub connected for WebSocket');
        } catch (error) {
            console.error('❌ Redis Pub/Sub setup failed:', error.message);
            this._retryPubSubConnection();
        }
    }

    _retryPubSubConnection() {
        if (this.pubSubRetryAttempts >= this.maxPubSubRetries) {
            console.error(`❌ Redis Pub/Sub: Max retries (${this.maxPubSubRetries}) reached. WebSocket will work without cross-instance sync.`);
            return;
        }
        this.pubSubRetryAttempts++;
        const delay = Math.min(2000 * Math.pow(2, this.pubSubRetryAttempts - 1), 30000);
        console.log(`🔄 Redis Pub/Sub retry ${this.pubSubRetryAttempts}/${this.maxPubSubRetries} in ${delay}ms...`);
        setTimeout(() => this.setupRedisSubscriber(), delay);
    }

    setupWebSocketServer(server = null) {
        if (server) {
            // Attach to existing server (Express)
            this.wss = new WebSocket.Server({ server, path: '/ws', clientTracking: true });
            console.log('🚀 WebSocket server attached to main HTTP server');
        } else {
            // Create standalone server
            this.server = http.createServer();
            this.wss = new WebSocket.Server({ server: this.server, path: '/ws', clientTracking: true });
            this.server.listen(this.port, () => console.log(`🚀 WebSocket server running on port ${this.port}`));
        }

        this.wss.on('connection', (ws, req) => this.handleConnection(ws, req));
    }

    handleConnection(ws, req) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const brandId = url.searchParams.get('brandId') || 'default';

        ws.brandId = brandId;
        this.connections.add(ws);
        this.stats.totalConnections++;
        this.stats.activeConnections = this.connections.size;

        this.sendToClient(ws, { type: 'connection', message: `Connected to ${brandId} updates`, brandId });

        ws.on('close', () => {
            this.connections.delete(ws);
            this.stats.activeConnections = this.connections.size;
        });

        ws.on('error', (error) => {
            console.error(`🔴 WebSocket client error (${brandId}):`, error.message);
            this.connections.delete(ws);
        });
    }

    handleRedisMessage(channel, message) {
        try {
            const data = JSON.parse(message);
            this.broadcastToClients(data);
            this.stats.messagesReceived++;
        } catch (error) {
            console.error('❌ Error handling Redis message:', error);
        }
    }

    async notifyUpdate(models, type, entityType, id, data = {}) {
        const { brandId } = models;
        const notification = {
            brandId,
            type: `${entityType}_${type}`,
            id,
            data,
            timestamp: new Date().toISOString()
        };

        this.broadcastToClients(notification);
        await this.publishToRedis('tenant_updates', notification);
    }

    async publishToRedis(channel, data) {
        if (!this.redisPublisher) return;
        try {
            await this.redisPublisher.publish(channel, JSON.stringify(data));
            this.stats.messagesPublished++;
        } catch (error) {
            console.error('❌ Redis publish error:', error);
        }
    }

    broadcastToClients(message) {
        if (!this.wss) return;
        this.connections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN && (ws.brandId === message.brandId || ws.brandId === 'all')) {
                this.sendToClient(ws, message);
            }
        });
    }

    sendToClient(ws, message) {
        try {
            ws.send(JSON.stringify(message));
        } catch (error) {
            console.error('❌ Error sending message to client:', error);
        }
    }

    async shutdown() {
        if (this.wss) this.wss.close();
        if (this.server) this.server.close();
        if (this.redisSubscriber) await this.redisSubscriber.disconnect();
        if (this.redisPublisher) await this.redisPublisher.disconnect();
    }
}

const wsServerInstance = new WebSocketServer();

const initializeWebSocketServer = (server) => wsServerInstance.initialize(server);
const shutdownWebSocketServer = () => wsServerInstance.shutdown();
const getWebSocketServer = () => wsServerInstance;

module.exports = {
    initializeWebSocketServer,
    shutdownWebSocketServer,
    getWebSocketServer
};