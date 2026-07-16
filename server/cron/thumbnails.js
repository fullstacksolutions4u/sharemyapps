const Project = require('../models/Project');
const { generateAndUploadThumbnail } = require('../utils/thumbnailGenerator');

// We use node-cron to run this task periodically
const cron = require('node-cron');

// Prevent overlapping runs
let isRunning = false;

async function processMissingThumbnails() {
  if (isRunning) return;
  isRunning = true;

  try {
    // Find up to 5 approved projects that have no bannerImage
    // We limit to 5 per run to avoid hitting rate limits on APIs
    const projects = await Project.find({
      status: 'approved',
      $or: [{ bannerImage: { $exists: false } }, { bannerImage: '' }],
    }).limit(5);

    if (projects.length > 0) {
      console.log(`[Thumbnail Cron] Found ${projects.length} projects without thumbnails. Processing...`);

      for (const project of projects) {
        if (!project.liveUrl) continue;

        console.log(`[Thumbnail Cron] Generating thumbnail for ${project.title} (${project.liveUrl})`);
        
        const cachedUrl = await generateAndUploadThumbnail(project.liveUrl);
        
        if (cachedUrl) {
          project.bannerImage = cachedUrl;
          await project.save();
          console.log(`[Thumbnail Cron] Successfully updated thumbnail for ${project.title}`);
        } else {
          console.log(`[Thumbnail Cron] Failed to generate thumbnail for ${project.title}`);
          // Optional: We could set bannerImage to a placeholder or a 'failed' marker to avoid infinite retries
        }
      }
    }
  } catch (err) {
    console.error('[Thumbnail Cron] Error:', err.message);
  } finally {
    isRunning = false;
  }
}

// Run every 5 minutes
const task = cron.schedule('*/5 * * * *', processMissingThumbnails, {
  scheduled: false // We will start it manually in index.js
});

module.exports = { processMissingThumbnails, task };
