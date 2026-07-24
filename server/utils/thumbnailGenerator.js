const { cloudinary } = require('../middleware/upload');

/**
 * Captures a screenshot of the given URL using Microlink API,
 * uploads it to Cloudinary, and returns the Cloudinary secure URL.
 * 
 * @param {string} liveUrl - The URL of the hosted app.
 * @returns {Promise<string|null>} - The Cloudinary image URL or null if failed.
 */
async function generateAndUploadThumbnail(liveUrl) {
  try {
    // Use Thum.io API to reliably get a screenshot.
    // It returns the image directly which Cloudinary can fetch.
    const screenshotUrl = `https://image.thum.io/get/width/1200/crop/800/noanimate/${liveUrl}`;

    // Upload the generated screenshot URL to our Cloudinary account
    const uploadRes = await cloudinary.uploader.upload(screenshotUrl, {
      folder: 'sharemyapp/thumbnails',
      format: 'webp', // Convert to webp for better performance
      transformation: [{ width: 800, crop: 'limit' }],
    });

    return uploadRes.secure_url;
  } catch (err) {
    console.error('[Thumbnail] Error generating thumbnail:', err.message);
    return null;
  }
}

module.exports = { generateAndUploadThumbnail };
