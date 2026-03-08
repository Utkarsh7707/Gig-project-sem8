const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Load environment variables
dotenv.config();
// Import Routes
const authRoutes = require('./routes/authRoutes');
// const adminRoutes = require('./routes/adminRoutes'); // Uncomment when ready
// const transactionRoutes = require('./routes/transactionRoutes'); // Uncomment when ready
const aggregatorRoutes = require('./routes/aggregatorRoutes');

const adminRoutes = require('./routes/adminRoutes'); // Add this line to import admin routes
const workerRoutes = require('./routes/workerRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
// Initialize Express
const app = express();

// --- Middleware ---

// Body parser to accept JSON data in requests
app.use(express.json());

// Enable CORS so your React frontend (port 5173) can communicate with your Express backend (port 5000)
app.use(cors());

// Add basic security headers
app.use(helmet());

// Log HTTP requests in the console during development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// --- Mount Routers ---
app.use('/api/auth', authRoutes);

app.use('/api/admin', adminRoutes); // Uncomment when ready
// Add to your mounted routes
app.use('/api/aggregators', aggregatorRoutes);
app.use('/api/worker', workerRoutes);
app.use('/api/payments', paymentRoutes);
// Placeholder routes for the next steps
// app.use('/api/admin', adminRoutes);
// app.use('/api/transactions', transactionRoutes);

// Base route for health checking
app.get('/', (req, res) => {
  res.send('Gig Worker Social Security API is running...');
});

// --- Database Connection & Server Start ---
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1); // Exit process with failure
  });