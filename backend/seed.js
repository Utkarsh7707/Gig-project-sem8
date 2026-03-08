const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Aggregator = require('./models/Aggregator'); // NEW: Import the Aggregator model

// Load env variables
dotenv.config();

// 1. Human Users (Admins & Workers)
const humanSeed = [
  {
    name: 'Gov Welfare Admin',
    email: 'admin@welfare.gov',
    password: 'password123', // Will be hashed by the pre-save hook
    role: 'ADMIN'
  }
];

// 2. Platform Systems (Aggregators)
// Notice how they no longer have passwords or roles!
const platformSeed = [
  {
    name: 'Zomato Simulator',
    email: 'api@zomato.com',
    apiKey: 'zomato_dev_key_12345',
    levyPercentage: 2,
    levyStatus: 'PENDING_LEVY',
    platformFeePercentage: 25 // 25% commission
  },
  {
    name: 'Uber Simulator',
    email: 'api@uber.com',
    apiKey: 'uber_dev_key_67890',
    levyPercentage: null,
    levyStatus: 'PENDING_LEVY',
    platformFeePercentage: 30 // 30% commission
  },
  {
    name: 'Swiggy Simulator',
    email: 'api@swiggy.com',
    apiKey: 'swiggy_dev_key_11223',
    levyPercentage: 1.5,
    levyStatus: 'APPROVED',
    platformFeePercentage: 20 // 20% commission
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');
    console.log('Running safe seed (checking for existing data)...');

    // Seed Humans
    console.log('\n--- Seeding Humans ---');
    for (const data of humanSeed) {
      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        console.log(`⏩ Skipped: ${data.email} (Admin already exists)`);
      } else {
        const user = new User(data);
        await user.save();
        console.log(`✅ Inserted: ${data.email}`);
      }
    }

    // Seed Platforms
    console.log('\n--- Seeding Platforms ---');
    for (const data of platformSeed) {
      const existingAggregator = await Aggregator.findOne({ email: data.email });
      if (existingAggregator) {
        console.log(`⏩ Skipped: ${data.email} (Platform already exists)`);
      } else {
        const aggregator = new Aggregator(data);
        await aggregator.save();
        console.log(`✅ Inserted: ${data.name}`);
      }
    }

    console.log('\nDatabase sync complete! Your existing workers are safe.');
    process.exit();
  } catch (error) {
    console.error('❌ Error with data import:', error);
    process.exit(1);
  }
};

seedDB();