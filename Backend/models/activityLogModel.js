const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    userName: { type: String, required: true },
    userEmail: { type: String },
    role: { type: String },
    action: {
        type: String,
        required: true,
        enum: [
            'CREATE_STORE', 'UPDATE_STORE', 'DELETE_STORE',
            'CREATE_COUPON', 'UPDATE_COUPON', 'DELETE_COUPON',
            'CREATE_CATEGORY', 'UPDATE_CATEGORY', 'DELETE_CATEGORY',
            'LOGIN', 'LOGOUT'
        ]
    },
    brandId: { type: String, required: true, index: true },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    targetName: { type: String },
    details: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now, index: true }
}, {
    timestamps: true,
    autoIndex: false
});

// Compound index for date-wise user tracking
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ brandId: 1, timestamp: -1 });

module.exports = activityLogSchema;
