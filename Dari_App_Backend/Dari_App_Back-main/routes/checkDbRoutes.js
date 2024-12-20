const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// Define the /check-db endpoint
router.get('/check-db', async (req, res) => {
  try {
    // Check if the database connection is ready
    if (mongoose.connection.readyState === 1) {
      return res.status(200).json({ message: 'Database is connected successfully' });
    } else {
      return res.status(500).json({ message: 'Database is not connected' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Error checking database connection', error: error.message });
  }
});

module.exports = router;
