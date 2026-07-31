const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { deleteFromFirebase } = require('../utils/firebase');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Custom multer storage engine for Cloudinary
class CloudinaryStorage {
  _handleFile(_req, file, cb) {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'sharemyapp',
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) return cb(error);
        cb(null, {
          path: result.secure_url,
          filename: result.public_id, // e.g. "sharemyapp/abcdef12345"
          size: result.bytes,
        });
      }
    );
    file.stream.pipe(stream);
  }

  _removeFile(_req, file, cb) {
    cloudinary.uploader.destroy(file.filename)
      .then(() => cb(null))
      .catch(err => cb(err));
  }
}

const upload = multer({
  storage: new CloudinaryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const getPublicIdFromUrl = (url) => {
  const parts = url.split('/image/upload/');
  if (parts.length < 2) return null;
  const remaining = parts[1].replace(/^v\d+\//, '');
  return remaining.substring(0, remaining.lastIndexOf('.')) || remaining;
};

const deleteImage = async (url) => {
  if (!url) return;
  try {
    if (url.includes('cloudinary')) {
      const publicId = getPublicIdFromUrl(url);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId).catch(() => {});
      }
    } else if (url.includes('storage.googleapis.com')) {
      await deleteFromFirebase(url);
    }
  } catch (err) {
    console.error('Error deleting image:', err);
  }
};

module.exports = { upload, cloudinary, deleteImage };
