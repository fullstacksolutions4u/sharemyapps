const { uploadToFirebase } = require('./firebase');
const crypto = require('crypto');

/**
 * Captures a screenshot of the given URL using Thum.io API,
 * uploads it to Firebase Storage, and returns the public URL.
 * 
 * @param {string} liveUrl - The URL of the hosted app.
 * @returns {Promise<string|null>} - The Firebase image URL or null if failed.
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

    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const filename = `thumbnails/${uniqueSuffix}.webp`;

    // Upload to Firebase Storage
    const publicUrl = await uploadToFirebase(buffer, 'image/webp', filename);
    return publicUrl;
  } catch (err) {
    console.error('[Thumbnail] Error generating thumbnail:', err.message);
    return null;
  }
}

module.exports = { generateAndUploadThumbnail };
