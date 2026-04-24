const Category = require('../models/Category');
const mongoose = require('mongoose');
const multer = require('multer');
const { deleteImage, uploadImageBuffer } = require('../utils/cloudinary');

// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, webp)'));
    }
  }
});

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate('collection');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch categories', error: err.message });
  }
};

exports.createCategory = async (req, res) => {
  // Handle file upload middleware
  const uploadSingle = upload.single('image');

  uploadSingle(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      // Multer should populate req.body with form-data fields
      // Access fields safely
      const name = req.body?.name;
      const description = req.body?.description;
      const image = req.body?.image;
      const collection = req.body?.collection;

      // Validate required fields
      if (!name || (typeof name === 'string' && !name.trim())) {
        return res.status(400).json({ message: 'Category name is required' });
      }

      // Validate collection ID if provided
      if (collection && !mongoose.Types.ObjectId.isValid(collection)) {
        return res.status(400).json({ message: 'Invalid collection ID format' });
      }

      // Handle image field: prioritize uploaded file, then use image URL from body
      let imageUrl = undefined;
      if (req.file) {
        // Upload file buffer to Cloudinary
        try {
          imageUrl = await uploadImageBuffer(req.file.buffer, 'romaterra/categories');
        } catch (uploadErr) {
          return res.status(400).json({ message: 'Failed to upload image' });
        }
      } else if (image) {
        imageUrl = image.trim(); // Use URL from body if provided
      }

      // Prepare category data
      const categoryData = {
        name: typeof name === 'string' ? name.trim() : name,
        description: description && typeof description === 'string' ? description.trim() : description,
        image: imageUrl,
        collection: collection || undefined,
      };

      const category = await Category.create(categoryData);
      res.status(201).json(category);
    } catch (err) {
      // Handle duplicate key error (unique constraint)
      if (err.code === 11000) {
        return res.status(400).json({ message: 'Category name already exists' });
      }
      res.status(400).json({ message: 'Failed to create category' });
    }
  });
};

exports.updateCategory = async (req, res) => {
  // Handle file upload middleware
  const uploadSingle = upload.single('image');

  uploadSingle(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      // Ensure req.body exists (multer should populate it, but add safety check)
      const body = req.body || {};
      const { name, description, image, collection } = body;
      const category = await Category.findById(req.params.id);

      if (!category) return res.status(404).json({ message: 'Category not found' });

      // Build update object with only provided fields
      const updateData = {};

      if (name !== undefined) {
        if (!name || !name.trim()) {
          return res.status(400).json({ message: 'Category name cannot be empty' });
        }
        updateData.name = name.trim();
      }

      if (description !== undefined) {
        updateData.description = description ? description.trim() : undefined;
      }

      if (collection !== undefined) {
        if (collection && !mongoose.Types.ObjectId.isValid(collection)) {
          return res.status(400).json({ message: 'Invalid collection ID format' });
        }
        updateData.collection = collection || undefined;
      }

      // Handle image field - prioritize uploaded file, then use image URL from body
      if (req.file) {
        // Delete old image from Cloudinary if it exists
        if (category.image) {
          try {
            // Extract public_id from Cloudinary URL
            const publicId = category.image.split('/').slice(-2).join('/').split('.')[0];
            await deleteImage(`romaterra/categories/${publicId}`);
          } catch (err) {
            console.error('Error deleting old category image:', err);
          }
        }
        // Upload new file buffer to Cloudinary
        try {
          updateData.image = await uploadImageBuffer(req.file.buffer, 'romaterra/categories');
        } catch (uploadErr) {
          return res.status(400).json({ message: 'Failed to upload image' });
        }
      } else if (image !== undefined) {
        // If image is explicitly set (including empty string to remove), handle it
        if (image === '' || image === null) {
          // Delete old image if removing it
          if (category.image) {
            try {
              const publicId = category.image.split('/').slice(-2).join('/').split('.')[0];
              await deleteImage(`romaterra/categories/${publicId}`);
            } catch (err) {
              console.error('Error deleting old category image:', err);
            }
          }
          updateData.image = undefined;
        } else if (image && image.trim()) {
          // Only update if new image URL is different from current
          if (image.trim() !== category.image) {
            // Delete old image from Cloudinary if it exists
            if (category.image) {
              try {
                const publicId = category.image.split('/').slice(-2).join('/').split('.')[0];
                await deleteImage(`romaterra/categories/${publicId}`);
              } catch (err) {
                console.error('Error deleting old category image:', err);
              }
            }
            updateData.image = image.trim();
          }
        }
      }

      const updatedCategory = await Category.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      });
      res.json(updatedCategory);
    } catch (err) {
      res.status(400).json({ message: 'Failed to update category' });
    }
  });
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    // Delete image from Cloudinary if it exists
    if (category.image) {
      try {
        // Extract public_id from Cloudinary URL
        const publicId = category.image.split('/').slice(-2).join('/').split('.')[0];
        await deleteImage(`romaterra/categories/${publicId}`);
      } catch (err) {
        console.error('Error deleting category image:', err);
      }
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete category' });
  }
};




