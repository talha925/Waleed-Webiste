const mongoose = require('mongoose');
const slugify = require('slugify');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sanitizeHtml = require('sanitize-html');

/**
 * Common Schemas Registry
 * Defined once, used across all tenant connections
 */

// 1. User Schema
const UserSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Name is required'] },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'super-admin'],
        default: 'user'
    },
    savedCoupons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' }],
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true
    },
    // Tracking & Multi-Brand Access
    allowedBrands: [{ type: String }], // e.g. ["pennyscroll", "blogzenix"]
    totalStoresAdded: { type: Number, default: 0 },
    totalCouponsAdded: { type: Number, default: 0 },
    lastActive: Date
}, {
    timestamps: true
});

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

UserSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

UserSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
};

// 2. Category Schema (Coupons Category)
const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }
}, { timestamps: true });

// 3. Blog Category Schema
const BlogCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

BlogCategorySchema.pre('save', async function (next) {
    if (this.isNew || this.isModified('name')) {
        try {
            let baseSlug = slugify(this.name, { lower: true, strict: true, trim: true });
            const slugRegEx = new RegExp(`^${baseSlug}(-[0-9]*)?$`, 'i');
            const existingSlugs = await this.constructor.find({ slug: slugRegEx, _id: { $ne: this._id } }).select('slug').lean();
            if (existingSlugs.length > 0) {
                const suffixes = existingSlugs.map(doc => {
                    const match = doc.slug.match(/-(\d+)$/);
                    return match ? parseInt(match[1]) : 0;
                }).sort((a, b) => b - a);
                const nextSuffix = (suffixes[0] || 0) + 1;
                this.slug = `${baseSlug}-${nextSuffix}`;
            } else {
                this.slug = baseSlug;
            }
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// 4. Store Schema
const ALLOWED_HEADINGS = ['Promo Codes & Coupon', 'Coupons & Promo Codes', 'Voucher & Discount Codes'];
const StoreSchema = new mongoose.Schema({
    name: { type: String, required: true, index: 'text' },
    slug: { type: String, unique: true, index: 'text' },
    trackingUrl: { type: String, required: true },
    short_description: { type: String, required: true, index: 'text' },
    long_description: { type: String, required: true, index: 'text' },
    image: {
        url: { type: String, required: true },
        alt: { type: String, required: true },
    },
    coupons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' }],
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    seo: {
        meta_title: { type: String, maxlength: 60 },
        meta_description: { type: String, maxlength: 160 },
        meta_keywords: { type: String, maxlength: 200 },
    },
    language: { type: String, default: 'English' },
    isTopStore: { type: Boolean, default: false },
    isEditorsChoice: { type: Boolean, default: false },
    heading: {
        type: String,
        default: 'Coupons & Promo Codes',
        set: (v) => v?.replace(/&amp;/g, '&').trim(),
        validate: {
            validator: (v) => ALLOWED_HEADINGS.includes(v),
            message: props => `Invalid heading: ${props.value}`
        }
    },
    // Tracking Fields
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdByName: { type: String },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedByName: { type: String }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

StoreSchema.index({ name: 'text', slug: 'text', short_description: 'text', long_description: 'text' });
StoreSchema.index({ language: 1, isTopStore: 1 });
StoreSchema.index({ language: 1, isEditorsChoice: 1 });
StoreSchema.index({ language: 1, categories: 1 });
StoreSchema.index({ createdAt: -1 });

StoreSchema.pre('save', async function (next) {
    if (this.isModified('name')) {
        let slug = slugify(this.name, { lower: true, strict: true });
        let slugExists = await this.constructor.findOne({ slug });
        let counter = 1;
        while (slugExists) {
            slug = `${slug}-${counter}`;
            slugExists = await this.constructor.findOne({ slug });
            counter++;
        }
        this.slug = slug;
    }
    next();
});

StoreSchema.virtual('couponCount').get(function () {
    return this.coupons ? this.coupons.length : 0;
});

StoreSchema.statics.findTopStores = function (limit = 10) {
    return this.find({ isTopStore: true })
        .select('name slug image short_description')
        .limit(limit)
        .lean();
};

StoreSchema.methods.hasActiveCoupons = async function () {
    const activeCoupons = await this.model('Coupon').countDocuments({
        store: this._id,
        active: true
    });
    return activeCoupons > 0;
};

// 5. Coupon Schema
const CouponSchema = new mongoose.Schema({
    offerDetails: { type: String, required: true },
    code: { type: String },
    active: { type: Boolean, default: true },
    isValid: { type: Boolean, default: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    featuredForHome: { type: Boolean, default: false },
    hits: { type: Number, default: 0 },
    lastAccessed: { type: Date, default: null },
    order: { type: Number, default: 0 },
    // Tracking Fields
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdByName: { type: String },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedByName: { type: String }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

CouponSchema.index({ store: 1, isValid: 1, active: 1, order: 1 });
CouponSchema.index({ store: 1, order: 1 });
CouponSchema.index({ store: 1, featuredForHome: 1 });
CouponSchema.index({ store: 1, code: 1 }, { partialFilterExpression: { code: { $type: 'string' } } });
CouponSchema.pre('validate', function (next) {
    if (!this.active && !this.code) return next(new Error("Either 'Code' or 'Active' must be provided"));
    next();
});

// 6. Blog Post Schema
const BlogPostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Blog post title is required'],
        trim: true,
        maxlength: [200, 'Title cannot be more than 200 characters']
    },
    slug: { type: String, unique: true, lowercase: true },
    shortDescription: {
        type: String,
        trim: true,
        maxlength: [500, 'Short description cannot exceed 500 characters']
    },
    longDescription: { type: String, required: [true, 'Content is required'] },
    image: {
        url: { type: String, required: true },
        alt: { type: String, required: true },
    },
    meta: {
        title: String,
        description: String,
        keywords: [String],
        canonicalUrl: String,
        robots: { type: String, default: 'index, follow' }
    },
    author: {
        name: String,
        email: String,
        avatar: String,
    },
    category: {
        id: mongoose.Schema.Types.ObjectId,
        name: String,
        slug: String
    },
    store: {
        id: mongoose.Schema.Types.ObjectId,
        name: String,
        url: String
    },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    isFeaturedForHome: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false }, // Keep for backward compatibility
    FrontBanner: { type: Boolean, default: false },
    publishDate: Date,
    lastUpdated: Date,
    version: { type: String, default: 'v1' },
    robots: { type: String, default: 'index, follow' },
    tags: [String],
    faqs: [{
        question: String,
        answer: String
    }],
    engagement: {
        views: { type: Number, default: 0 },
        readingTime: String,
        wordCount: Number
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Blog Indexes
BlogPostSchema.index({ title: 'text', shortDescription: 'text' });
BlogPostSchema.index({ status: 1, publishDate: -1 });
BlogPostSchema.index({ FrontBanner: 1, status: 1, publishDate: -1 });
BlogPostSchema.index({ 'category.id': 1, status: 1, publishDate: -1 });
BlogPostSchema.index({ 'store.id': 1, status: 1, publishDate: -1 });

function safeHtml(input) {
    return sanitizeHtml(input, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h2', 'h3']),
        allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            img: ['src', 'alt', 'width', 'height'],
        }
    });
}

BlogPostSchema.pre('save', async function (next) {
    if (this.isNew || this.isModified('title')) {
        try {
            let baseSlug = slugify(this.title, { lower: true, strict: true, trim: true });
            if (!baseSlug) baseSlug = 'untitled';
            const slugRegEx = new RegExp(`^${baseSlug}(-[0-9]*)?$`, 'i');
            const existingSlugs = await this.constructor.find({ slug: slugRegEx, _id: { $ne: this._id } }).select('slug').lean();
            if (existingSlugs.length > 0) {
                const suffixes = existingSlugs.map(doc => {
                    const match = doc.slug.match(/-(\d+)$/);
                    return match ? parseInt(match[1]) : 0;
                }).sort((a, b) => b - a);
                const nextSuffix = (suffixes[0] || 0) + 1;
                this.slug = `${baseSlug}-${nextSuffix}`;
            } else {
                this.slug = baseSlug;
            }
        } catch (error) {
            return next(error);
        }
    }
    next();
});

BlogPostSchema.pre('save', function (next) {
    if (this.isModified('longDescription')) {
        this.longDescription = safeHtml(this.longDescription);
        const wordCount = this.longDescription.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length;
        this.engagement.wordCount = wordCount;
        this.engagement.readingTime = `${Math.ceil(wordCount / 200)} min read`;
    }
    this.robots = this.status === 'published' ? 'index, follow' : 'noindex, nofollow';
    this.lastUpdated = new Date();
    next();
});

const ActivityLogSchema = require('./activityLogModel');

/**
 * Model Cache
 */
const modelCache = new Map();

/**
 * Get models for the central database connection
 */
function getCentralModels(connection) {
    if (modelCache.has('central')) return modelCache.get('central');

    const models = {
        User: connection.model('User', UserSchema),
        ActivityLog: connection.model('ActivityLog', ActivityLogSchema)
    };

    modelCache.set('central', models);
    return models;
}

/**
 * Get models for a specific database connection (Tenant specific)
 */
function getTenantModels(connection) {
    const connId = connection.id || connection.name;
    // Don't cache tenant-specific models under 'central' ID
    if (connId === 'central') return getCentralModels(connection);

    if (modelCache.has(connId)) return modelCache.get(connId);

    const models = {
        Category: connection.model('Category', CategorySchema),
        BlogCategory: connection.model('BlogCategory', BlogCategorySchema),
        Store: connection.model('Store', StoreSchema),
        Coupon: connection.model('Coupon', CouponSchema),
        Blog: connection.model('BlogPost', BlogPostSchema),
    };

    modelCache.set(connId, models);
    return models;
}

module.exports = { getTenantModels, getCentralModels };
