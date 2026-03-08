const Pin = require('../models/Pin');

// @desc    Get all community pins (Now with populated comments!)
// @route   GET /api/map/pins
exports.getAllPins = async (req, res) => {
  try {
    const pins = await Pin.find()
      .populate('createdBy', 'name')
      .populate('comments.user', 'name') // Pull the commenter's name
      .sort({ createdAt: -1 });
    res.json(pins);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch map data' });
  }
};

// ... keep your existing createPin and votePin functions here ...
exports.createPin = async (req, res) => {
  try {
    const { title, category, lat, lng, description } = req.body;
    const newPin = await Pin.create({
      title, category, lat, lng, description,
      createdBy: req.user._id,
      upvotes: [req.user._id]
    });
    // Populate before sending back so the UI updates instantly
    const populatedPin = await Pin.findById(newPin._id).populate('createdBy', 'name');
    res.status(201).json(populatedPin);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create pin', error: error.message });
  }
};

exports.votePin = async (req, res) => {
  try {
    const { voteType } = req.body;
    const workerId = req.user._id;
    const pin = await Pin.findById(req.params.id);

    if (!pin) return res.status(404).json({ message: 'Pin not found' });

    pin.upvotes = pin.upvotes.filter(id => id.toString() !== workerId.toString());
    pin.downvotes = pin.downvotes.filter(id => id.toString() !== workerId.toString());

    if (voteType === 'UP') pin.upvotes.push(workerId);
    if (voteType === 'DOWN') pin.downvotes.push(workerId);

    await pin.save();
    
    // Return fully populated pin
    const updatedPin = await Pin.findById(pin._id)
      .populate('createdBy', 'name')
      .populate('comments.user', 'name');
    res.json(updatedPin);
  } catch (error) {
    res.status(500).json({ message: 'Failed to register vote' });
  }
};

// --- NEW: Add a comment to a pin ---
// @desc    Add comment to a pin
// @route   POST /api/map/pins/:id/comments
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const pin = await Pin.findById(req.params.id);

    if (!pin) return res.status(404).json({ message: 'Pin not found' });

    // Push the new comment into the array
    pin.comments.push({
      text,
      user: req.user._id
    });

    await pin.save();

    // Re-fetch to populate the user's name for the frontend
    const updatedPin = await Pin.findById(pin._id)
      .populate('createdBy', 'name')
      .populate('comments.user', 'name');

    res.status(201).json(updatedPin);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add comment' });
  }
};