const Aggregator = require('../models/Aggregator');

const protectWithApiKey = async (req, res, next) => {
  let apiKey = req.header('x-api-key');

  if (!apiKey) {
    return res.status(401).json({ message: 'Not authorized, no API key provided' });
  }

  try {
    // Find the aggregator by their exact API key
   const aggregator = await Aggregator.findOne({ apiKey });

    if (!aggregator) {
      return res.status(401).json({ message: 'Not authorized, invalid API key' });
    }

    // Attach the aggregator object to the request
    req.user = aggregator;
    
    next(); // Success! Move on to the actual route controller
  } catch (error) {
    console.error("API Key Error:", error);
    res.status(500).json({ message: 'Server error during API key validation' });
  }
};

module.exports = { protectWithApiKey };