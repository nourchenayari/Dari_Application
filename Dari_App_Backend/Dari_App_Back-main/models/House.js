const mongoose = require('mongoose');

const houseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true, 
    minlength: 3,   
  },
  type: {
    type: String,
    required: true, 
    minlength: 3,   
  },
  description: {
    type: String,
    required: true, 
    minlength: 10,  
  },
  location: {
    type: String,
    required: false,
  },
  pricePerNight: {
    type: Number,
    required: true,
    min: [1, 'Le prix par nuit doit être supérieur à 0']
  },
  pricePerMonth: {
    type: Number,
    required: false,
    min: [1, 'Le prix par mois doit être supérieur à 0']
  },
  surface: {
    type: Number,
    required: false, 
    min: [1, 'La surface doit être supérieure à 0'], 
  },
  bedrooms: {
    type: Number,
    required: true, 
    min: [1, 'Le nombre de chambres doit être supérieur à 0'], 
  },
  bathrooms: {
    type: Number,
    required: true, 
    min: [1, 'Le nombre de salles de bain doit être supérieur à 0'], 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  images: {
    type: [String], 
    required: true, 
  },
  isAvailable: {
    type: Boolean,
    default: true,  
  },
  createdAt: {
    type: Date,
    default: Date.now, 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
});

module.exports = mongoose.model('House', houseSchema);
