const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  
    required: true,
  },
  house: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'House',  
    required: true,
  },
  checkInDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > Date.now();
      },
      message: 'La date de check-in doit être dans le futur.',
    },
  },
  checkOutDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.checkInDate && (value - this.checkInDate) >= 86400000; 
      },
      message: 'La date de check-out doit être au moins un jour après la date de check-in.',
    },
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'], 
    default: 'pending',
  },
  price: { type: Number, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
  paymentStatus: { 
    type: String,
     default: 'unpaid' },
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);
