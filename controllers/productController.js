const Product = require('../models/Product');
const { deleteImage } = require('../utils/cloudinary');

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('category collection');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch products', error: err.message });
  }
};

// Get single product
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category collection');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch product', error: err.message });
  }
};

// Create product
exports.createProduct = async (req, res) => {
  try {
    // Extract image URLs from uploaded files
    // When using multer.any(), req.files is an array
    // Filter to only get files from the 'images' field
    const imageUrls = [];
    if (req.files && Array.isArray(req.files)) {
      // Filter files from 'images' field only
      const imageFiles = req.files.filter(file => file.fieldname === 'images');
      if (imageFiles.length > 0) {
        imageUrls.push(...imageFiles.map(file => file.path));
      }
    } else if (req.file) {
      imageUrls.push(req.file.path);
    }

    // Parse other fields from req.body
    const productData = {
      ...req.body,
      images: imageUrls.length > 0 ? imageUrls : (req.body.images || []),
    };

    // Parse JSON fields if they're strings (common with multipart/form-data)
    if (typeof productData.colors === 'string') {
      try {
        productData.colors = JSON.parse(productData.colors);
      } catch (e) {
        productData.colors = productData.colors.split(',').map(c => c.trim());
      }
    }
    if (typeof productData.price === 'string') {
      productData.price = parseFloat(productData.price);
    }
    if (typeof productData.quantityInStock === 'string') {
      productData.quantityInStock = parseInt(productData.quantityInStock);
    }

    const product = await Product.create(productData);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create product', error: err.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Handle new image uploads
    // When using multer.any(), req.files is an array
    // Filter to only get files from the 'images' field
    const newImageUrls = [];
    if (req.files && Array.isArray(req.files)) {
      // Filter files from 'images' field only
      const imageFiles = req.files.filter(file => file.fieldname === 'images');
      if (imageFiles.length > 0) {
        newImageUrls.push(...imageFiles.map(file => file.path));
      }
    } else if (req.file) {
      newImageUrls.push(req.file.path);
    }

    // Update product data
    const updateData = { ...req.body };

    // If new images uploaded, add them to existing images or replace
    if (newImageUrls.length > 0) {
      const existingImages = product.images || [];
      updateData.images = req.body.replaceImages === 'true'
        ? newImageUrls
        : [...existingImages, ...newImageUrls];
    }

    // Parse JSON fields if needed
    if (typeof updateData.colors === 'string') {
      try {
        updateData.colors = JSON.parse(updateData.colors);
      } catch (e) {
        updateData.colors = updateData.colors.split(',').map(c => c.trim());
      }
    }
    if (typeof updateData.price === 'string') {
      updateData.price = parseFloat(updateData.price);
    }
    if (typeof updateData.quantityInStock === 'string') {
      updateData.quantityInStock = parseInt(updateData.quantityInStock);
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update product', error: err.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      for (const imageUrl of product.images) {
        try {
          // Extract public_id from Cloudinary URL
          const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
          await deleteImage(`romaterra/products/${publicId}`);
        } catch (err) {
          console.error('Error deleting image:', err);
        }
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete product', error: err.message });
  }
};

// Update stock quantity
exports.updateProductStock = async (req, res) => {
  try {
    const { quantityInStock } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { quantityInStock },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update stock', error: err.message });
  }
};



