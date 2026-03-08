const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Aggregator = require('../models/Aggregator');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const mongoose = require('mongoose');

// 1. Initialize Razorpay (Check your .env variable names!)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET // Using the Express convention
});

// ==========================================
// CREATE ORDER (Mirrors your Next.js POST)
// ==========================================
exports.createPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order || order.status !== 'OPEN') {
      return res.status(400).json({ message: "Gig no longer available" });
    }

    // ⚠️ CRITICAL: Math.round ensures absolutely no decimals are sent to Razorpay
    const amountInPaise = Math.round(order.grossFare * 100);

    // Keep it simple, exactly like your Next.js code
    const rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR"
    });
    
    // Pass the Razorpay order AND our database ID to the frontend
    res.json({ rzpOrder, dbOrderId: order._id });
  } catch (err) {
    console.error("Razorpay Creation Error:", err);
    res.status(500).json({ message: 'Error creating Razorpay order' });
  }
};

// ==========================================
// VERIFY & SPLIT (Mirrors your Next.js Verification)
// ==========================================
exports.verifyAndExecuteSplit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId } = req.body;
    const workerId = req.user._id;

    // 1. YOUR EXACT NEXT.JS VERIFICATION LOGIC
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error("Payment verification failed ❌ (Signature Mismatch)");
      throw new Error("Invalid payment signature. Potential fraud detected.");
    }
    
    console.log("Payment verified successfully ✅");

    // 2. THE ATOMIC SPLIT
    const order = await Order.findById(dbOrderId).session(session);
    if (!order || order.status !== 'OPEN') throw new Error('Gig already claimed');

    const aggregator = await Aggregator.findById(order.aggregatorId).session(session);

    const totalFare = order.grossFare;
    const platformFeePercent = aggregator.platformFeePercentage || 25; 
    const levyPercent = aggregator.levyPercentage || 2; 

    // The Math Breakdown
    const platformFee = parseFloat((totalFare * (platformFeePercent / 100)).toFixed(2));
    const workerPayout = parseFloat((totalFare - platformFee).toFixed(2));
    const welfareLevy = parseFloat((workerPayout * (levyPercent / 100)).toFixed(2));
    
    const esiSplit = parseFloat((welfareLevy * 0.25).toFixed(2));
    const epfSplit = parseFloat((welfareLevy * 0.75).toFixed(2));
    const aggregatorNetRevenue = parseFloat((platformFee - welfareLevy).toFixed(2));

    // Update Order Status
    order.status = 'COMPLETED';
    order.workerId = workerId;
    await order.save({ session });

    // Create Transaction Record
    const transaction = await Transaction.create([{
      workerId, aggregatorId: aggregator._id, totalFare, platformFee, 
      workerPayout, welfareLevy, esiSplit, epfSplit, status: 'COMPLETED'
    }], { session });

    // Update Worker Wallet
    let workerWallet = await Wallet.findOne({ userId: workerId }).session(session);
    if (!workerWallet) workerWallet = new Wallet({ userId: workerId });
    workerWallet.balance_withdrawable += workerPayout; 
    workerWallet.balance_esi += esiSplit;
    workerWallet.balance_epf += epfSplit;
    await workerWallet.save({ session });

    // Update Aggregator Wallet
    let aggWallet = await Wallet.findOne({ userId: aggregator._id }).session(session);
    if (!aggWallet) aggWallet = new Wallet({ userId: aggregator._id });
    aggWallet.balance_revenue += aggregatorNetRevenue;
    aggWallet.total_welfare_paid += welfareLevy;
    await aggWallet.save({ session });

    // Commit changes
    await session.commitTransaction();
    session.endSession();

    res.json({ message: "Payment verified & Ledger Split Successful!", transaction: transaction[0] });

  } catch (error) {
    // Rollback if ANY step fails
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message });
  }
};