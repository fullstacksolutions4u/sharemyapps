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
    // We use Microlink API to reliably get a screenshot.
    // It is synchronous and returns the screenshot URL when ready,
    // avoiding the "Generating Preview" placeholder issue of mshots.
    const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(liveUrl)}&screenshot=true&meta=false`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.status === 'success' && data.data && data.data.screenshot && data.data.screenshot.url) {
      const screenshotUrl = data.data.screenshot.url;

      // Upload the generated screenshot URL to our Cloudinary account
      const uploadRes = await cloudinary.uploader.upload(screenshotUrl, {
        folder: 'sharemyapp/thumbnails',
        format: 'webp', // Convert to webp for better performance
        transformation: [{ width: 800, crop: 'limit' }],
      });

      return uploadRes.secure_url;
    } else {
      console.error('[Thumbnail] Microlink API failed:', data);
      return null;
    }
  } catch (err) {
    console.error('[Thumbnail] Error generating thumbnail:', err.message);
    return null;
  }
}

module.exports = { generateAndUploadThumbnail };
