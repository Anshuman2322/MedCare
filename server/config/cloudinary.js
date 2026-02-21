import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

// Load environment variables from /server/.env
dotenv.config();

const { CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET } = process.env;

if (!CLOUD_NAME || !CLOUD_API_KEY || !CLOUD_API_SECRET) {
  console.warn('Cloudinary env vars are not set; uploads will fail.');
} else {
  // Debug log: which cloud_name are we configuring
  console.log('[Cloudinary] Using cloud_name:', CLOUD_NAME);
}

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUD_API_KEY,
  api_secret: CLOUD_API_SECRET,
});

export default cloudinary;
