const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

/**
 * Extracts the S3 Key from a full URL
 * @param {string} imageUrl - The full S3 URL
 * @returns {string|null} - The S3 Key
 */
const extractKeyfromUrl = (imageUrl) => {
    if (!imageUrl) return null;
    try {
        const url = new URL(imageUrl);
        // Path usually starts with /, so we remove it
        // Use decodeURIComponent to handle encoded characters like %20
        return decodeURIComponent(url.pathname.substring(1));
    } catch (error) {
        console.warn('[s3Utils] Failed to parse URL:', imageUrl);
        return null;
    }
};

/**
 * Deletes an image from S3 given its URL
 * @param {string} imageUrl - The full URL of the image to delete
 * @param {string} brandId - The brand ID to resolve the correct bucket
 */
const deleteImageFromS3 = async (imageUrl, brandId = 'blogzenix') => {
    if (!imageUrl) return;

    // Don't try to delete if it's not our S3 bucket
    if (!imageUrl.includes('s3.amazonaws.com') && !imageUrl.includes('s3.us-east-1.amazonaws.com')) {
        console.log('[s3Utils] Skipping deletion for non-S3 URL:', imageUrl);
        return;
    }

    const fileKey = extractKeyfromUrl(imageUrl);
    if (!fileKey) return;

    try {
        // Resolve bucket name - we can use a dummy host or just find by brandId in BRAND_MAP
        const { BRAND_MAP } = require('../config/brands');
        const brandConfig = BRAND_MAP.find(b => b.brandId === brandId) || BRAND_MAP[BRAND_MAP.length - 1];
        const bucketName = brandConfig.bucketName;

        console.log(`[s3Utils] Deleting key [${fileKey}] from bucket [${bucketName}]`);

        const command = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: fileKey,
        });

        await s3.send(command);
        console.log(`[s3Utils] Successfully deleted: ${fileKey}`);
    } catch (error) {
        console.error('[s3Utils] Error deleting from S3:', error.message);
        // We don't throw here to avoid failing the blog update just because old image deletion failed
    }
};

module.exports = {
    deleteImageFromS3,
    extractKeyfromUrl
};
