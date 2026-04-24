const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const requiredCloudinaryEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

const missingCloudinaryEnvVars = requiredCloudinaryEnvVars.filter((key) => !process.env[key]);

if (missingCloudinaryEnvVars.length > 0) {
  throw new Error(
    `Missing required Cloudinary env vars: ${missingCloudinaryEnvVars.join(', ')}`
  );
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer storage for Cloudinary - Products
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'romaterra/products', // Folder in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }], // Optional: resize images
  },
});

// Configure multer storage for Cloudinary - Categories
const categoryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'romaterra/categories', // Folder in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }], // Optional: resize images
  },
});

// Multer upload middleware
// Configure to accept files and allow all form fields to pass through
const productUpload = multer({
  storage: productStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});
const categoryUpload = multer({ storage: categoryStorage });

// Helper function to upload single image (products)
const uploadSingle = productUpload.single('image');

// Helper function to upload multiple images (products)
// Use any() to accept all fields - we'll filter 'images' field in controller
const uploadMultiple = productUpload.any();

// Helper function to upload single category image
const uploadCategoryImage = categoryUpload.single('image');

// Helper function to upload image buffer to Cloudinary
const uploadImageBuffer = async (buffer, folder = 'romaterra/categories') => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 800, height: 800, crop: 'limit' }],
    };

    cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result.secure_url);
      }
    }).end(buffer);
  });
};

// Helper function to delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadCategoryImage,
  uploadImageBuffer,
  deleteImage,
  cloudinary,
};


