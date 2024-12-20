const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: [true, 'L\'email est obligatoire'], 
    unique: true, 
    lowercase: true, 
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Veuillez entrer un email valide']
  },
  password: { 
    type: String, 
    required: [true, 'Le mot de passe est obligatoire'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
  },
  name: { 
    type: String, 
    trim: true,
    maxlength: [50, 'Le nom ne doit pas dépasser 50 caractères']
  },
  phone: { 
    type: String, 
    unique: true,
    sparse: true, // This allows multiple null values in a unique field
    match: [/^\d{8}$/, 'Le numéro de téléphone doit contenir exactement 8 chiffres']
  },
  profileImage: { 
    type: String, 
    default: 'default.jpg',
    validate: {
      validator: function(v) {
        return /\.(jpg|jpeg|png|gif)$/i.test(v);
      },
      message: props => `${props.value} n'est pas un format de fichier valide pour une image`
    }
  },
  role: { 
    type: String, 
    enum: ['user', 'admin','Locataire','annonceurs'], 
    default: 'user'
  },
  dateJoined: { 
    type: Date, 
    default: Date.now 
  },
  houses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'House'  
  }]
}, {
  timestamps: true 
});

module.exports = mongoose.model('User', UserSchema);
