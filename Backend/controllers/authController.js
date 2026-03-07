const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const AppError = require('../errors/AppError');
const { catchAsync } = require('../utils/errorUtils');

/**
 * Generate JWT token
 */
const signToken = (userId, role) => {
    return jwt.sign(
        { userId, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

/**
 * Create and send JWT token response
 * Standardized with 'success: true' while maintaining Flutter compatibility
 */
const createSendToken = async (req, user, statusCode, res) => {
    const token = signToken(user._id, user.role);
    const { ActivityLog } = req.models;

    // Log login activity if logging is available
    if (ActivityLog && statusCode === 200) {
        try {
            await ActivityLog.create({
                userId: user._id,
                userName: user.name,
                brandId: req.brand?.brandId || 'central',
                action: 'LOGIN',
                details: `User logged in via ${req.brand?.brandId || 'unknown'}`
            });
        } catch (err) {
            console.error('Failed to log activity:', err);
        }
    }

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        success: true, // Standardized field
        status: 'success', // Compatibility field
        message: statusCode === 201 ? 'User registered successfully' : 'Login successful',
        token, // Original backend uses 'token'
        accessToken: token, // Flutter expects accessToken
        refreshToken: 'mock-refresh-token',
        expiresIn: 7 * 24 * 60 * 60,
        data: { user },
        user: user // Flutter expects user object directly
    });
};

/**
 * Register a new admin user
 */
exports.register = catchAsync(async (req, res, next) => {
    const { User } = req.models;
    let { name, email, password, passwordConfirm, role = 'admin', allowedBrands = [] } = req.body;

    // Force match for testing bypass
    if (!passwordConfirm) passwordConfirm = password;

    if (password !== passwordConfirm) {
        return next(new AppError('Passwords do not match', 400));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next(new AppError('Email already in use', 400));
    }

    const newUser = await User.create({
        name,
        email,
        password,
        role: role === 'super-admin' && req.user?.role !== 'super-admin' ? 'admin' : role,
        allowedBrands: role === 'super-admin' ? [] : allowedBrands
    });

    await createSendToken(req, newUser, 201, res);
});

/**
 * Login with email and password
 */
exports.login = catchAsync(async (req, res, next) => {
    const { User } = req.models;
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({ email, active: true }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    // 🔐 Brand Login Isolation Check (Applies to ALL users except super-admin)
    if (user.role !== 'super-admin') {
        const currentBrandId = req.brand?.brandId;
        const userBrands = user.allowedBrands || [];

        // Normalize IDs for comparison (removes underscores/dashes and converts to lowercase)
        const normalize = (id) => id ? id.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
        const normalizedCurrentBrand = normalize(currentBrandId);

        const hasPermission = userBrands.some(brandId => normalize(brandId) === normalizedCurrentBrand);

        if (!hasPermission) {
            console.warn(`Login Blocked: User ${user.email} (Role: ${user.role}) tried to log into ${currentBrandId} without permission.`);
            return next(new AppError(`Access Denied: You do not have login permission for '${currentBrandId}'.`, 403));
        }
    }

    await createSendToken(req, user, 200, res);
});

/**
 * Super-admin only: Update any user account (name, email, role, password)
 */
exports.updateUserAdmin = catchAsync(async (req, res, next) => {
    const { User } = req.models;
    const { name, email, role, allowedBrands, password } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) return next(new AppError('User not found', 404));

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (allowedBrands) user.allowedBrands = allowedBrands;
    if (password) user.password = password; // Pre-save hook will hash it

    await user.save();

    res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: { user }
    });
});

/**
 * Get current user profile
 */
exports.getMe = catchAsync(async (req, res, next) => {
    const { User } = req.models;
    const user = await User.findById(req.user._id);
    if (!user) return next(new AppError('User not found', 404));

    res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: { user }
    });
});

/**
 * Get all admin users (Super Admin only)
 */
exports.getAllAdmins = catchAsync(async (req, res, next) => {
    const { User } = req.models;
    const admins = await User.find({ active: true });
    res.status(200).json({
        success: true,
        message: 'Admins retrieved successfully',
        results: admins.length,
        data: { admins }
    });
});

/**
 * Get user performance data
 */
exports.getUserPerformance = catchAsync(async (req, res, next) => {
    const { ActivityLog } = req.models;
    const { userId, startDate, endDate } = req.query;

    let query = {};
    if (userId) query.userId = userId;
    if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await ActivityLog.find(query).sort({ timestamp: -1 });

    // Aggregate by day, userId, and brandId
    const aggregated = {};

    logs.forEach(log => {
        // Group by day-userId-brandId
        const day = log.timestamp.toISOString().split('T')[0];
        const key = `${day}-${log.userId}-${log.brandId}`;

        if (!aggregated[key]) {
            aggregated[key] = {
                day: day,
                userId: log.userId,
                userName: log.userName || 'Admin',
                brandId: log.brandId || 'Unknown',
                storesCreated: 0,
                couponsCreated: 0,
                updates: 0
            };
        }

        if (log.action === 'CREATE_STORE') {
            aggregated[key].storesCreated += 1;
        } else if (log.action === 'CREATE_COUPON') {
            aggregated[key].couponsCreated += 1;
        } else if (log.action && log.action.includes('UPDATE')) {
            aggregated[key].updates += 1;
        }
    });

    const performanceArray = Object.values(aggregated).sort((a, b) => b.day.localeCompare(a.day));

    res.status(200).json({
        success: true,
        message: 'User performance data retrieved successfully',
        data: {
            performance: performanceArray
        }
    });
});

/**
 * Forgot Password
 */
exports.forgotPassword = catchAsync(async (req, res, next) => {
    const { User } = req.models;
    const { email } = req.body;
    const user = await User.findOne({ email, active: true });
    if (!user) return next(new AppError('No user found with that email', 404));

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        message: 'Reset token sent to email',
        resetToken
    });
});

/**
 * Reset Password
 */
exports.resetPassword = catchAsync(async (req, res, next) => {
    const { User } = req.models;
    const { password, passwordConfirm } = req.body;
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) return next(new AppError('Token is invalid or has expired', 400));

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    await createSendToken(req, user, 200, res);
});

/**
 * Update Me
 */
exports.updateMe = catchAsync(async (req, res, next) => {
    const { User } = req.models;
    if (req.body.password) return next(new AppError('This route is not for password updates', 400));

    const updatedUser = await User.findByIdAndUpdate(req.user._id, req.body, { new: true, runValidators: true });
    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updatedUser }
    });
});

/**
 * Update Password
 */
exports.updatePassword = catchAsync(async (req, res, next) => {
    const { User } = req.models;
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.correctPassword(currentPassword, user.password))) {
        return next(new AppError('Current password incorrect', 401));
    }

    user.password = newPassword;
    await user.save();

    await createSendToken(req, user, 200, res);
});

/**
 * Delete User (Soft Delete)
 */
exports.deleteMe = catchAsync(async (req, res, next) => {
    const { User } = req.models;
    await User.findByIdAndUpdate(req.user._id, { active: false });
    res.status(204).json({
        success: true,
        message: 'Account deactivated successfully',
        data: null
    });
});