const express = require('express');
const router = express.Router();
const { protectWithApiKey } = require('../middlewares/apiAuthMiddleware');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
// @desc    Get aggregator profile via API Key
// @route   GET /api/aggregators/me
router.get('/me', protectWithApiKey, async (req, res) => {
  try {
    const aggregator = req.user;
    res.json({
      id: aggregator._id,
      name: aggregator.name,
      email: aggregator.email,
      levyPercentage: aggregator.levyPercentage,
      levyStatus: aggregator.levyStatus,
      isArchived: aggregator.isArchived,
      platformFeePercentage: aggregator.platformFeePercentage // Added so frontend can see commission!
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving platform data' });
  }
});

// @desc    Submit levy percentage for admin approval
// @route   PUT /api/aggregators/levy
router.put('/levy', protectWithApiKey, async (req, res) => {
  try {
    const { levyPercentage } = req.body;
    
    if (!levyPercentage || levyPercentage < 1 || levyPercentage > 5) {
      return res.status(400).json({ message: 'Levy must be between 1% and 5%' });
    }

    const aggregator = req.user; 
    
    // 1. Force the database updates
    aggregator.levyPercentage = levyPercentage;
    aggregator.levyStatus = 'PENDING_LEVY';
    aggregator.isArchived = true; // Auto-suspend system
    
    // 2. Save it securely to MongoDB
    await aggregator.save();
    
    console.log(`🔒 Platform ${aggregator.name} changed their levy to ${levyPercentage}% and was AUTO-ARCHIVED.`);

    // 3. Send the exact new state back to the frontend
    res.json({
      levyPercentage: aggregator.levyPercentage,
      levyStatus: aggregator.levyStatus,
      isArchived: aggregator.isArchived
    });
  } catch (error) {
    console.error("Levy Update Error:", error);
    res.status(500).json({ message: 'Server error submitting levy' });
  }
});

// @desc    Update Platform Fee (Commission) - No Admin approval required
// @route   PUT /api/aggregators/commission
router.put('/commission', protectWithApiKey, async (req, res) => {
  try {
    const { platformFeePercentage } = req.body;
    
    if (platformFeePercentage < 0 || platformFeePercentage > 100) {
      return res.status(400).json({ message: 'Invalid commission percentage' });
    }

    const aggregator = req.user; 
    
    // Update the commission instantly without locking the account
    aggregator.platformFeePercentage = platformFeePercentage;
    await aggregator.save();

    console.log(`💰 Platform ${aggregator.name} changed their commission to ${platformFeePercentage}%`);

    res.json({ platformFeePercentage: aggregator.platformFeePercentage });
  } catch (error) {
    console.error("Commission Update Error:", error);
    res.status(500).json({ message: 'Server error updating commission' });
  }
});

// @desc    Get ledger transactions for the logged-in aggregator
// @route   GET /api/aggregators/transactions
router.get('/transactions', protectWithApiKey, async (req, res) => {
  try {
    // Fetch only transactions belonging to THIS aggregator, and get the worker's name
    const transactions = await Transaction.find({ aggregatorId: req.user._id })
      .populate('workerId', 'name email')
      .sort({ createdAt: -1 });
      
    res.json(transactions);
  } catch (error) {
    console.error("Ledger Fetch Error:", error);
    res.status(500).json({ message: 'Server error retrieving transactions' });
  }
});

// @desc    Get aggregator wallet balances
// @route   GET /api/aggregators/wallet
router.get('/wallet', protectWithApiKey, async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user._id });
    
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user._id });
    }
    
    res.json(wallet);
  } catch (error) {
    console.error("Wallet Fetch Error:", error);
    res.status(500).json({ message: 'Error fetching aggregator wallet' });
  }
});
module.exports = router;