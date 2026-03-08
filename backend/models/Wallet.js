const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: { // <--- THIS MUST BE userId, NOT workerId
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  // Worker Balances
  balance_withdrawable: { type: Number, default: 0 },
  balance_esi: { type: Number, default: 0 }, 
  balance_epf: { type: Number, default: 0 },
  
  // Aggregator Balances (for later)
  balance_revenue: { type: Number, default: 0 }, 
  total_welfare_paid: { type: Number, default: 0 } 
}, { timestamps: true });

module.exports = mongoose.model('Wallet', walletSchema);