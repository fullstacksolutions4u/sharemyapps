const { Storage } = require('@google-cloud/storage');
const path = require('path');

const storageOptions = {};
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  storageOptions.keyFilename = path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)
    ? process.env.GOOGLE_APPLICATION_CREDENTIALS
    : path.join(__dirname, '..', process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

const storage = new Storage(storageOptions);
const bucketName = process.env.FIREBASE_STORAGE_BUCKET;

const getBucket = () => {
  if (!bucketName) {
    throw new Error('FIREBASE_STORAGE_BUCKET environment variable is not defined.');
  }
  return storage.bucket(bucketName);
};

/**
 * Uploads a file buffer to Firebase Storage and returns its public URL.
 * @param {Buffer} buffer - The file buffer.
 * @param {string} mimeType - The mime type of the file.
 * @param {string} filename - The target filename in the bucket.
 * @returns {Promise<string>} The public URL of the uploaded file.
 */
const uploadToFirebase = async (buffer, mimeType, filename) => {
  if (!bucketName) {
    throw new Error('FIREBASE_STORAGE_BUCKET environment variable is not defined.');
  }

  const bucket = getBucket();
  const file = bucket.file(filename);
  await file.save(buffer, {
    metadata: {
      contentType: mimeType,
      cacheControl: 'public, max-age=31536000',
    },
  });

  try {
    await file.makePublic();
  } catch (err) {
    console.warn('makePublic failed (Public Access Prevention might be active):', err.message);
  }

  return `https://storage.googleapis.com/${bucketName}/${filename}`;
};

/**
 * Deletes a file from Firebase Storage given its public URL.
 * @param {string} fileUrl - The public URL of the file.
 * @returns {Promise<void>}
 */
const deleteFromFirebase = async (fileUrl) => {
  if (!bucketName || !fileUrl) return;

  try {
    const prefix = `https://storage.googleapis.com/${bucketName}/`;
    if (fileUrl.startsWith(prefix)) {
      const filename = fileUrl.replace(prefix, '');
      const bucket = getBucket();
      const file = bucket.file(filename);
      await file.delete();
      console.log(`Deleted file from Firebase Storage: ${filename}`);
    }
  } catch (err) {
    console.error(`Failed to delete file from Firebase Storage: ${fileUrl}`, err);
  }
};

module.exports = {
  uploadToFirebase,
  deleteFromFirebase,
  getBucket,
};
