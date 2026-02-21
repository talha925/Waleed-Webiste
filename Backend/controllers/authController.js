const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const AppError = require('../errors/AppError');

// Generate JWT token
const signToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// Create and send JWT token response
const createSendToken = (models, user, statusCode, res) => {
    const { User } = models;
    const token = signToken(user._id);

    // Update last login time
    User.findByIdAndUpdate(user._id, { lastLogin: Date.now() }).catch(err => {
        console.error('Failed to update last login time:', err);
    });

    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: { user }
    });
};

/**
 * Register a new admin user
 */
exports.register = async (req, res, next) => {
    const { User } = req.models;
    try {
        const { name, email, password, passwordConfirm, role = 'admin' } = req.body;

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
            role: role === 'super-admin' && req.user?.role !== 'super-admin' ? 'admin' : role
        });

        createSendToken(req.models, newUser, 201, res);
    } catch (error) {
        next(new AppError(error.message || 'Error registering user', error.statusCode || 500));
    }
};

/**
 * Login with email and password
 */
exports.login = async (req, res, next) => {
    const { User } = req.models;
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new AppError('Please provide email and password', 400));
        }

        const user = await User.findOne({ email, active: true }).select('+password');

        if (!user || !(await user.correctPassword(password, user.password))) {
            return next(new AppError('Incorrect email or password', 401));
        }

        if (user.role !== 'admin' && user.role !== 'super-admin') {
            return next(new AppError('Access denied. Admin privileges required', 403));
        }

        createSendToken(req.models, user, 200, res);
    } catch (error) {
        next(new AppError(error.message || 'Error logging in', error.statusCode || 500));
    }
};

/**
 * Get current user profile
 */
exports.getMe = async (req, res, next) => {
    const { User } = req.models;
    try {
        const user = await User.findById(req.user);
        if (!user) return next(new AppError('User not found', 404));

        res.status(200).json({ status: 'success', data: { user } });
    } catch (error) {
        next(new AppError(error.message || 'Error fetching profile', error.statusCode || 500));
    }
};

/**
 * Update current user password
 */
exports.updatePassword = async (req, res, next) => {
    const { User } = req.models;
    try {
        const { currentPassword, newPassword, passwordConfirm } = req.body;

        if (!currentPassword || !newPassword || !passwordConfirm) {
            return next(new AppError('Please provide all details', 400));
        }

        if (newPassword !== passwordConfirm) {
            return next(new AppError('New passwords do not match', 400));
        }

        const user = await User.findById(req.user).select('+password');
        if (!(await user.correctPassword(currentPassword, user.password))) {
            return next(new AppError('Current password is incorrect', 401));
        }

        user.password = newPassword;
        await user.save();

        createSendToken(req.models, user, 200, res);
    } catch (error) {
        next(new AppError(error.message || 'Error updating password', error.statusCode || 500));
    }
};

/**
 * Forgot password
 */
exports.forgotPassword = async (req, res, next) => {
    const { User } = req.models;
    try {
        const { email } = req.body;
        const user = await User.findOne({ email, active: true });
        if (!user) return next(new AppError('No user found', 404));

        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            status: 'success',
            message: 'Token sent (Dev: see resetToken below)',
            resetToken
        });
    } catch (error) {
        next(new AppError(error.message || 'Error requesting password reset', error.statusCode || 500));
    }
};

/**
 * Reset password
 */
exports.resetPassword = async (req, res, next) => {
    const { User } = req.models;
    try {
        const { password, passwordConfirm } = req.body;
        const { token } = req.params;

        if (password !== passwordConfirm) return next(new AppError('Passwords do not match', 400));

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });

        if (!user) return next(new AppError('Token is invalid or has expired', 400));

        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        createSendToken(req.models, user, 200, res);
    } catch (error) {
        next(new AppError(error.message || 'Error resetting password', error.statusCode || 500));
    }
};

/**
 * Update user account
 */
exports.updateMe = async (req, res, next) => {
    const { User } = req.models;
    try {
        if (req.body.password || req.body.passwordConfirm) return next(new AppError('Not for password updates', 400));

        const filteredBody = {};
        ['name', 'email'].forEach(key => { if (req.body[key]) filteredBody[key] = req.body[key]; });

        const updatedUser = await User.findByIdAndUpdate(req.user, filteredBody, { new: true, runValidators: true });
        res.status(200).json({ status: 'success', data: { user: updatedUser } });
    } catch (error) {
        next(new AppError(error.message || 'Error updating user', error.statusCode || 500));
    }
};

/**
 * Deactivate user account
 */
exports.deleteMe = async (req, res, next) => {
    const { User } = req.models;
    try {
        await User.findByIdAndUpdate(req.user, { active: false });
        res.status(204).json({ status: 'success', data: null });
    } catch (error) {
        next(new AppError(error.message || 'Error deactivating account', error.statusCode || 500));
    }
};

/**
 * Get all admin users
 */
exports.getAllAdmins = async (req, res, next) => {
    const { User } = req.models;
    try {
        const admins = await User.find({ role: { $in: ['admin', 'super-admin'] }, active: true }).select('-__v');
        res.status(200).json({ status: 'success', results: admins.length, data: { admins } });
    } catch (error) {
        next(new AppError(error.message || 'Error fetching admin users', error.statusCode || 500));
    }
};