const User = require('../models/User');
const Aggregator = require('../models/Aggregator'); // <-- Updated to the new model!
const Wallet = require('../models/Wallet');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// @desc    Get worker's wallet balances
// @route   GET /api/worker/wallet
// @desc    Get worker's wallet balances
// @route   GET /api/worker/wallet
exports.getWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user._id });
    
    // If a new worker logs in, create their wallet automatically
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user._id });
    }
    res.json(wallet);
  } catch (error) {
    // 👇 ADD THIS LINE TO SEE THE REAL ERROR IN YOUR TERMINAL 👇
    console.error("Wallet Fetch/Create Error:", error); 
    
    res.status(500).json({ message: 'Error fetching wallet', error: error.message });
  }
};
// @desc    Get all OPEN orders broadcasted by aggregators
// @route   GET /api/worker/orders/open
exports.getOpenOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: 'OPEN' })
      .populate('aggregatorId', 'name levyPercentage platformFeePercentage')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching open orders' });
  }
};

// @desc    Get worker's transaction history
// @route   GET /api/worker/transactions
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ workerId: req.user._id })
      .populate('aggregatorId', 'name')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions' });
  }
};

// @desc    Accept an order and execute the Atomic Split
// @route   POST /api/worker/orders/:id/accept
exports.acceptOrder = async (req, res) => {
  // ⚠️ CRITICAL FIX: These await calls MUST be inside this async function block!
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const orderId = req.params.id;
    const workerId = req.user._id;

    // 1. Lock the order and ensure it is still OPEN
    const order = await Order.findById(orderId).session(session);
    if (!order || order.status !== 'OPEN') {
      throw new Error('Order is no longer available');
    }

    // 2. Get the aggregator (From the new Aggregator collection)
    const aggregator = await Aggregator.findById(order.aggregatorId).session(session);
    if (!aggregator || aggregator.levyStatus !== 'APPROVED') {
      throw new Error('Platform is currently suspended');
    }

    // ==========================================
    // 3. THE NEW FINANCIAL ALGORITHM
    // ==========================================
    const totalFare = order.grossFare; // e.g., ₹800
    const platformFeePercent = aggregator.platformFeePercentage || 25; 
    const levyPercent = aggregator.levyPercentage || 2; 

    // Step A: Commission & Payout
    const platformFee = parseFloat((totalFare * (platformFeePercent / 100)).toFixed(2)); // e.g., ₹200
    const workerPayout = parseFloat((totalFare - platformFee).toFixed(2)); // e.g., ₹600

    // Step B: Welfare Levy (Based on Worker Payout, per Karnataka rules)
    const welfareLevy = parseFloat((workerPayout * (levyPercent / 100)).toFixed(2)); // e.g., ₹12
    
    // Step C: Internal Split
    const esiSplit = parseFloat((welfareLevy * 0.25).toFixed(2)); // ₹3
    const epfSplit = parseFloat((welfareLevy * 0.75).toFixed(2)); // ₹9

    const aggregatorNetRevenue = parseFloat((platformFee - welfareLevy).toFixed(2)); // ₹188

    // 4. Update the Order status
    order.status = 'COMPLETED';
    order.workerId = workerId;
    await order.save({ session });

    // 5. Create the Transaction record
    const transaction = await Transaction.create([{
      workerId,
      aggregatorId: aggregator._id,
      totalFare,
      platformFee,
      workerPayout,
      welfareLevy,
      esiSplit,
      epfSplit,
      status: 'COMPLETED'
    }], { session });

    // 6. Update the Worker's Wallet (using userId)
    let workerWallet = await Wallet.findOne({ userId: workerId }).session(session);
    if (!workerWallet) workerWallet = new Wallet({ userId: workerId });
    
    workerWallet.balance_withdrawable += workerPayout; 
    workerWallet.balance_esi += esiSplit;
    workerWallet.balance_epf += epfSplit;
    await workerWallet.save({ session });

    // 7. Update the Aggregator's Wallet
    let aggWallet = await Wallet.findOne({ userId: aggregator._id }).session(session);
    if (!aggWallet) aggWallet = new Wallet({ userId: aggregator._id });

    aggWallet.balance_revenue += aggregatorNetRevenue;
    aggWallet.total_welfare_paid += welfareLevy;
    await aggWallet.save({ session });

    // 8. Commit everything to MongoDB
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: 'Order accepted successfully', transaction: transaction[0] });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message || 'Transaction failed' });
  }
};