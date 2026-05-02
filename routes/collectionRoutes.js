const express = require('express');
const {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
} = require('../controllers/collectionController');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', getCollections);
router.post('/', authenticateAdmin, createCollection);
router.put('/:id', authenticateAdmin, updateCollection);
router.delete('/:id', authenticateAdmin, deleteCollection);

module.exports = router;
