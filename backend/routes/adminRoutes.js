const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();
const { 
  getAggregators, 
  createAggregator, 
  updateAggregator, 
  simulateRide, 
  broadcastOrder,
  rotateApiKey
} = require('../controllers/adminController');

// In a real app, you would add an admin authentication middleware here
// router.use(protect, adminMiddleware);

router.get('/aggregators',protect, getAggregators);
router.post('/aggregators', protect,createAggregator);
router.put('/aggregators/:id', protect, updateAggregator);
router.post('/simulate-ride', protect,simulateRide);
router.post('/orders/broadcast', protect, broadcastOrder);
router.patch('/aggregators/:id/rotate-key', protect, rotateApiKey);
module.exports = router;