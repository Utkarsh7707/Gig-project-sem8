const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware'); // Or wherever you saved it
const { 
  getWallet, 
  getOpenOrders, 
  getTransactions, 
  acceptOrder 
} = require('../controllers/workerController');

// All routes require the user to be logged in (protect middleware)
router.get('/wallet', protect, getWallet);
router.get('/orders/open', protect, getOpenOrders);
router.get('/transactions', protect, getTransactions);
router.post('/orders/:id/accept', protect, acceptOrder);

module.exports = router;