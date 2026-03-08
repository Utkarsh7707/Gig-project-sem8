const User = require('../models/User');
const Aggregator = require('../models/Aggregator'); // NEW: Import the Aggregator model
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Order = require('../models/Order');
const crypto = require('crypto');
const mongoose = require('mongoose');

// ==========================================
// AGGREGATOR MANAGEMENT
// ==========================================

// @desc    Get all aggregators
// @route   GET /api/admin/aggregators
exports.getAggregators = async (req, res) => {
  try {
    // Fetch directly from the new Aggregator collection
    const aggregators = await Aggregator.find();
    res.json(aggregators);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching aggregators' });
  }
};

// @desc    Admin creates an aggregator and generates an API Key
// @route   POST /api/admin/aggregators
exports.createAggregator = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Check Aggregator collection
    const exists = await Aggregator.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already in use' });

    const newApiKey = crypto.randomBytes(32).toString('hex');
    
    // Create in Aggregator collection (no role or password needed)
    const aggregator = await Aggregator.create({
      name, email, apiKey: newApiKey
    });

    res.status(201).json({ aggregator, apiKey: newApiKey });
  } catch (error) {
    res.status(500).json({ message: 'Server error creating aggregator' });
  }
};

// @desc    Update Aggregator Status (Approve Levy, Archive)
// @route   PUT /api/admin/aggregators/:id
exports.updateAggregator = async (req, res) => {
  try {
    const { levyStatus, isArchived, levyPercentage ,apiKey} = req.body;
    
    const aggregator = await Aggregator.findByIdAndUpdate(
      req.params.id,
      { levyStatus, isArchived, levyPercentage },
      { new: true, runValidators: true }
    );
    res.json(aggregator);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating aggregator' });
  }
};

// ==========================================
// THE TRANSACTION ENGINE (ATOMIC SPLIT)
// ==========================================

// @desc    Simulate a ride and split funds
// @route   POST /api/admin/simulate-ride
exports.simulateRide = async (req, res) => {
  const { aggregatorId, workerEmail, grossFare } = req.body;
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Validate Entities using their respective models
    const worker = await User.findOne({ email: workerEmail.toLowerCase(), role: 'WORKER' }).session(session);
    const aggregator = await Aggregator.findById(aggregatorId).session(session);

    if (!worker) throw new Error('Worker not found');
    if (!aggregator) throw new Error('Invalid Aggregator');
    if (aggregator.levyStatus !== 'APPROVED') throw new Error('Aggregator levy not approved yet');

    // 2. The New Financial Algorithm
    const totalFare = Number(grossFare);
    const platformFeePercent = aggregator.platformFeePercentage || 25; 
    const levyPercent = aggregator.levyPercentage || 2; 

    const platformFee = parseFloat((totalFare * (platformFeePercent / 100)).toFixed(2));
    const workerPayout = parseFloat((totalFare - platformFee).toFixed(2));

    const welfareLevy = parseFloat((workerPayout * (levyPercent / 100)).toFixed(2));
    const esiSplit = parseFloat((welfareLevy * 0.25).toFixed(2));            
    const epfSplit = parseFloat((welfareLevy * 0.75).toFixed(2));            
    const aggregatorNetRevenue = parseFloat((platformFee - welfareLevy).toFixed(2));

    // 3. Record the Transaction in the Ledger
    const transaction = await Transaction.create([{
      workerId: worker._id,
      aggregatorId: aggregator._id,
      totalFare,
      platformFee,
      workerPayout,
      welfareLevy,
      esiSplit,
      epfSplit,
      status: 'COMPLETED'
    }], { session });

    // 4. Update or Create the Worker's Wallet (using userId)
    let workerWallet = await Wallet.findOne({ userId: worker._id }).session(session);
    if (!workerWallet) {
      workerWallet = new Wallet({ userId: worker._id });
    }
    
    workerWallet.balance_withdrawable += workerPayout;
    workerWallet.balance_esi += esiSplit;
    workerWallet.balance_epf += epfSplit;
    await workerWallet.save({ session });

    // 5. Update or Create the Aggregator's Wallet (using userId)
    let aggWallet = await Wallet.findOne({ userId: aggregator._id }).session(session);
    if (!aggWallet) {
      aggWallet = new Wallet({ userId: aggregator._id });
    }

    aggWallet.balance_revenue += aggregatorNetRevenue;
    aggWallet.total_welfare_paid += welfareLevy;
    await aggWallet.save({ session });

    // 6. Commit the Transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: 'Atomic split successful',
      breakdown: { totalFare, platformFee, workerPayout, welfareLevy, esiSplit, epfSplit, aggregatorNetRevenue },
      transaction: transaction[0]
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: 'Transaction failed', error: error.message });
  }
};

// ==========================================
// ORDER BROADCASTING
// ==========================================

// @desc    Broadcast a new open order to the gig pool
// @route   POST /api/admin/orders/broadcast
exports.broadcastOrder = async (req, res) => {
  try {
    const { aggregatorId, grossFare } = req.body;

    // 1. Verify the aggregator is valid and approved (Using Aggregator model)
    const aggregator = await Aggregator.findById(aggregatorId);
    
    if (!aggregator || aggregator.levyStatus !== 'APPROVED' || aggregator.isArchived) {
      return res.status(400).json({ message: 'Invalid or unauthorized platform.' });
    }

    if (!grossFare || grossFare <= 0) {
      return res.status(400).json({ message: 'Invalid fare amount.' });
    }

    // 2. Create the open order
    const order = await Order.create({
      aggregatorId,
      grossFare,
      status: 'OPEN'
    });

    console.log(`📡 Broadcasted new ₹${grossFare} order from ${aggregator.name}`);

    res.status(201).json({ message: 'Order broadcasted successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error broadcasting order', error: error.message });
  }
};

exports.rotateApiKey = async (req, res) => {
  try {
    // 1. Generate a new secure 64-character hex key on the server
    const newApiKey = crypto.randomBytes(32).toString('hex');
    
    // 2. Safely swap ONLY the API key in the database
    const aggregator = await Aggregator.findByIdAndUpdate(
      req.params.id,
      { apiKey: newApiKey },
      { new: true } // Returns the updated document
    );

    if (!aggregator) {
      return res.status(404).json({ message: 'Platform not found' });
    }

    res.json({ message: 'API Key rotated successfully', apiKey: newApiKey });
  } catch (error) {
    res.status(500).json({ message: 'Server error rotating key', error: error.message });
  }
};