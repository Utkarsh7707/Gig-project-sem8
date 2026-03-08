const mongoose = require('mongoose');

const aggregatorSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  apiKey: {
    type: String,
    unique: true,
    required: true
  },
  levyPercentage: {
    type: Number,
    min: [1, 'Levy must be at least 1%'],
    max: [5, 'Levy cannot exceed 5%'],
    default: null
  },
  levyStatus: {
    type: String,
    enum: ['PENDING_LEVY', 'APPROVED', 'REJECTED'],
    default: 'PENDING_LEVY'
  },
  platformFeePercentage: {
    type: Number,
    min: [0, 'Cannot be negative'],
    max: [100, 'Cannot exceed 100%'],
    default: 25 // Default 25% commission
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Aggregator', aggregatorSchema);