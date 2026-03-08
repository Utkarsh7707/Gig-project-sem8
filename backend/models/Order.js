const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  aggregatorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Aggregator', // <--- CRITICAL: Make sure this says 'Aggregator', not 'User'!
    required: true 
  },
  grossFare: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['OPEN', 'COMPLETED', 'CANCELLED'], 
    default: 'OPEN' 
  },
  workerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // This stays 'User' because workers are humans
    default: null 
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);