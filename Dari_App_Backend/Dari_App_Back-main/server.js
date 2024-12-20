require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const houseRoutes = require('./routes/houseRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const commentRoutes = require('./routes/Commentroutes');
const authRoutes = require('./routes/auth');
const checkDbRoutes = require('./routes/checkDbRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Check for required environment variables
if (!process.env.MONGODB_URI) {
  console.error('Error: MONGODB_URI is missing in the environment variables.');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('Error: JWT_SECRET is missing in the environment variables.');
  process.exit(1);
}

// Middleware to parse JSON
app.use(express.json());

// Connect to the database
connectDB();

// Log all incoming requests (for debugging)
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// API routes
app.use('/houses', houseRoutes); // Routes for houses
app.use('/hr', reservationRoutes); // Routes for reservations
app.use('/payments', paymentRoutes); // Routes for payments
app.use('/auth', authRoutes); // Routes for authentication
app.use('/housesComment', commentRoutes); // Routes for house comments
app.use('/db', checkDbRoutes); // Routes for database checks

// Handle 404 errors for undefined routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
