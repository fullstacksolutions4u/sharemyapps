const multer = require('multer');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Custom multer storage engine for Cloudinary v2 (replaces multer-storage-cloudinary)
class CloudinaryStorage {
  _handleFile(_req, file, cb) {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'findmyapp',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1200, crop: 'limit' }],
      },
      (error, result) => {
        if (error) return cb(error);
        cb(null, { path: result.secure_url, filename: result.public_id, size: result.bytes });
      }
    );
    file.stream.pipe(uploadStream);
  }

  _removeFile(_req, file, cb) {
    cloudinary.uploader.destroy(file.filename, cb);
  }
}

const upload = multer({
  storage: new CloudinaryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = { upload, cloudinary };
