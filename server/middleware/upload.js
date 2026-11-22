import multer from "multer";

// store file in memory first
const storage = multer.memoryStorage();

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  // Only product images are uploaded here; anything else is refused up front.
  fileFilter(_req, file, callback) {
    if (IMAGE_TYPES.has(file.mimetype)) return callback(null, true);
    const error = new Error('Only JPEG, PNG, WebP or GIF images can be uploaded.');
    error.status = 400;
    return callback(error);
  },
});

export default upload;