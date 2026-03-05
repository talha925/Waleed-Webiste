const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const AppError = require('../errors/AppError');

/**
 * Protect routes - verify JWT token and set req.user
 * Multi-tenant aware: Uses the User model from the current brand's database
 */
exports.protect = async (req, res, next) => {
    try {
        const User = req.models.User;
        const currentBrandId = req.models.brandId;

        // 1) Check if token exists
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new AppError('You are not logged in. Please log in to get access.', 401));
        }

        // 2) Verify token
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

        // 3) Check if user still exists in Central Database
        const currentUser = await User.findById(decoded.userId);
        if (!currentUser) {
            return next(new AppError('The user belonging to this token no longer exists.', 401));
        }

        // 4) Check if user is active
        if (!currentUser.active) {
            return next(new AppError('This user account has been deactivated.', 401));
        }

        // 5) 🔐 Brand Authorization Check
        // Super-admins can access any brand. 
        // Admins must have the brandId in their allowedBrands array.
        if (currentUser.role === 'admin') {
            if (!currentUser.allowedBrands || !currentUser.allowedBrands.includes(currentBrandId)) {
                return next(new AppError(`Access Denied: You do not have permission for the brand '${currentBrandId}'.`, 403));
            }
        }

        // Grant access
        req.user = currentUser;
        req.userRole = currentUser.role;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new AppError('Invalid token. Please log in again.', 401));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new AppError('Your token has expired. Please log in again.', 401));
        }
        next(new AppError('Authentication error', 500));
    }
};

/**
 * Restrict access to certain roles
 */
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.userRole)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};

/**
 * Create first super-admin (Legacy - needs to be moved to a tenant-aware route)
 */
exports.createFirstSuperAdmin = async (models) => {
    try {
        const User = models.User;
        const adminCount = await User.countDocuments({ role: 'super-admin' });

        if (adminCount === 0 && process.env.INIT_ADMIN_EMAIL && process.env.INIT_ADMIN_PASSWORD) {
            await User.create({
                name: 'Super Admin',
                email: process.env.INIT_ADMIN_EMAIL,
                password: process.env.INIT_ADMIN_PASSWORD,
                role: 'super-admin',
                active: true
            });
            console.log('✅ Initial super-admin created for tenant db.');
        }
    } catch (error) {
        console.error('❌ Failed to create initial super-admin:', error.message);
    }
};
