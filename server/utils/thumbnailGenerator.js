const { cloudinary } = require('../middleware/upload');
const crypto = require('crypto');

/**
 * Captures a screenshot of the given URL using Thum.io API,
 * uploads it to Cloudinary, and returns the secure URL.
 * 
 * @param {string} liveUrl - The URL of the hosted app.
 * @returns {Promise<string|null>} - The Cloudinary image URL or null if failed.
 */
async function generateAndUploadThumbnail(liveUrl) {
  try {
    // Use Thum.io API to reliably get a screenshot.
    const screenshotUrl = `https://image.thum.io/get/width/1200/crop/800/noanimate/${liveUrl}`;

    // Fetch the generated screenshot image buffer
    const response = await fetch(screenshotUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch screenshot from thum.io: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload buffer to Cloudinary using upload_stream
    const secureUrl = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'sharemyapp',
          resource_type: 'image',
          format: 'webp',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      stream.end(buffer);
    });

    return secureUrl;
  } catch (err) {
    console.error('[Thumbnail] Error generating thumbnail:', err.message);
    return null;
  }
}

module.exports = { generateAndUploadThumbnail };
