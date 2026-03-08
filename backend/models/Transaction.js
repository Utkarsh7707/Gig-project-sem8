const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  workerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  aggregatorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Aggregator', // Ensure this points to the new Aggregator model
    required: true 
  },
  
  // ==========================================
  // UPDATED MATH FIELDS
  // ==========================================
  totalFare: { type: Number, required: true },       // The ₹800 the customer paid (Replaced grossFare)
  platformFee: { type: Number, required: true },     // The ₹200 commission 
  workerPayout: { type: Number, required: true },    // The ₹600 the worker earned
  welfareLevy: { type: Number, required: true },     // The ₹12 aggregator contribution
  
  esiSplit: { type: Number, required: true },        // 25% Health Allocation
  epfSplit: { type: Number, required: true },        // 75% Pension Allocation
  
  status: { type: String, enum: ['COMPLETED', 'FAILED'], default: 'COMPLETED' }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);