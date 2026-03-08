const mongoose = require('mongoose');

const pinSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['RESTROOM', 'WATER', 'FOOD', 'PARKING', 'HAZARD', 'REST_ZONE'], 
    required: true 
  },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  description: { type: String },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // --- NEW: Community Comments Array ---
  comments: [{
    text: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

pinSchema.virtual('score').get(function() {
  return this.upvotes.length - this.downvotes.length;
});

pinSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Pin', pinSchema);