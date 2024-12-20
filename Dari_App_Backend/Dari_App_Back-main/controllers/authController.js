const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const House = require('../models/House');


exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'admin' ? 'admin' : 'user';

    const newUser = new User({ name, email, password: hashedPassword, role: userRole });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const houses = await House.find({ userId: req.user.userId ,status: 'approved' });

    res.status(200).json({
      name: user.name,
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage,
      houses: houses, 
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erreur lors de la récupération du profil', error });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const { name, phone, profileImage } = req.body;

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (profileImage) user.profileImage = profileImage;

    await user.save();
    const houses = await House.find({ userId: req.user.userId });

    res.status(200).json({
      message: 'Profil mis à jour avec succès',
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        houses: houses,      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du profil', error });
  }
};
///partie admin 
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find(); 
    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'Aucun utilisateur trouvé' });
    }
    res.status(200).json({ message: 'Utilisateurs récupérés avec succès', users });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs', error: error.message });
  }
}
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    await User.deleteOne({ _id: req.params.id });

    res.status(200).json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur', error: error.message });
  }
};
exports.updateUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    user.role = req.body.role || user.role;
    await user.save();

    res.status(200).json({ message: 'Rôle de l\'utilisateur mis à jour avec succès', user });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du rôle', error: error.message });
  }
};
////
exports.logout = (req, res) => {
  try {
    res.clearCookie('authToken'); 

    res.status(200).json({ message: 'Déconnexion réussie' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la déconnexion', error: error.message });
  }
};

exports.checkLogin = (req, res) => {
  try {
    const token = req.headers['authorization']?.replace('Bearer ', '').trim();
    if (!token) {
      return res.status(401).json({ isLoggedIn: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json({ isLoggedIn: true, userId: decoded.userId, role: decoded.role });
  } catch (error) {
    res.status(401).json({ isLoggedIn: false, message: 'Invalid or expired token' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params; // User ID from the URL
    const { name, email, password } = req.body; // Fields to update

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the user's details
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    await user.save();
    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};
