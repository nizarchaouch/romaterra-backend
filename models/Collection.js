const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, unique: true },
        description: { type: String, trim: true },
        image: { type: String, trim: true },
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Collection', collectionSchema);




