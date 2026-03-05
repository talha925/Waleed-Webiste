/**
 * Activity Logger Helper
 * Logs user actions to the central database and updates user stats.
 */
const logActivity = async (req, { action, targetId, targetName, details }) => {
    try {
        const { ActivityLog, User } = req.models;
        const user = req.user; // Assuming user is attached via auth middleware

        if (!user) {
            console.warn('⚠️ skip logging: No user found on request');
            return;
        }

        // 1. Create the log entry in Central DB
        await ActivityLog.create({
            userId: user._id,
            userName: user.name,
            userEmail: user.email,
            role: user.role,
            brandId: req.models.brandId,
            action,
            targetId,
            targetName,
            details,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        // 2. Increment counters on the Central User record
        const update = { lastActive: new Date() };
        if (action.includes('STORE')) {
            update.$inc = { totalStoresAdded: action === 'CREATE_STORE' ? 1 : 0 };
        } else if (action.includes('COUPON')) {
            update.$inc = { totalCouponsAdded: action === 'CREATE_COUPON' ? 1 : 0 };
        }

        await User.findByIdAndUpdate(user._id, update);

    } catch (error) {
        console.error('❌ Activity Logger Error:', error);
    }
};

module.exports = { logActivity };
