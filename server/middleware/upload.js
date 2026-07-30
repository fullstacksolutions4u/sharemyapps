const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { uploadToFirebase, deleteFromFirebase } = require('../utils/firebase');
const crypto = require('crypto');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Custom multer storage engine for Firebase Storage
class FirebaseStorage {
  _handleFile(_req, file, cb) {
    const chunks = [];
    file.stream.on('data', chunk => chunks.push(chunk));
    file.stream.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const parts = file.originalname.split('.');
        const extension = parts.length > 1 ? parts.pop() : 'png';
        const filename = `uploads/${uniqueSuffix}.${extension}`;

        const publicUrl = await uploadToFirebase(buffer, file.mimetype, filename);
        cb(null, { path: publicUrl, filename: filename, size: buffer.length });
      } catch (err) {
        cb(err);
      }
    });
    file.stream.on('error', err => cb(err));
  }

  _removeFile(_req, file, cb) {
    deleteFromFirebase(`https://storage.googleapis.com/${process.env.FIREBASE_STORAGE_BUCKET}/${file.filename}`)
      .then(() => cb(null))
      .catch(err => cb(err));
  }
}

const upload = multer({
  storage: new FirebaseStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const deleteImage = async (url) => {
  if (!url) return;
  try {
    if (url.includes('cloudinary')) {
      const pid = url.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`sharemyapp/${pid}`).catch(() => {});
    } else if (url.includes('storage.googleapis.com')) {
      await deleteFromFirebase(url);
    }
  } catch (err) {
    console.error('Error deleting image:', err);
  }
};

module.exports = { upload, cloudinary, deleteImage };
