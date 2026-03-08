const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware'); // Must be logged in as a worker!
const { createPaymentOrder, verifyAndExecuteSplit } = require('../controllers/paymentController');

router.post('/create-order', protect, createPaymentOrder);
router.post('/verify', protect, verifyAndExecuteSplit);

module.exports = router;