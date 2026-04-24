const Collection = require('../models/Collection');

exports.getCollections = async (req, res) => {
    try {
        const collections = await Collection.find();
        res.json(collections);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch collections' });
    }
};

exports.createCollection = async (req, res) => {
    try {
        const collection = await Collection.create(req.body);
        res.status(201).json(collection);
    } catch (err) {
        res.status(400).json({ message: 'Failed to create collection' });
    }
};

exports.updateCollection = async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                message: 'Request body is empty.',
            });
        }

        const collection = await Collection.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!collection) return res.status(404).json({ message: 'Collection not found' });
        res.json(collection);
    } catch (err) {
        res.status(400).json({ message: 'Failed to update collection' });
    }
};

exports.deleteCollection = async (req, res) => {
    try {
        const collection = await Collection.findByIdAndDelete(req.params.id);
        if (!collection) return res.status(404).json({ message: 'Collection not found' });
        res.json({ message: 'Collection deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete collection' });
    }
};



