require('dotenv').config(); 
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');  
const userController = require('../controllers/authController');
const authController = require('../controllers/authController');

const router = express.Router();
const { verifyAdmin }  = require('../middleware/auth');

router.put('/:id/updateUser', auth, verifyAdmin, authController.updateUser);

// Register route
router.post('/register', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
  check('role', 'Role must be either "user" or "admin"').optional().isIn(['user', 'admin']) ,
  check('name')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, role, name } = req.body;
  try {
    // Vérification si l'utilisateur existe déjà
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Hashage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'admin' ? 'admin' : 'user'; // Définir le rôle de l'utilisateur

    // Création d'un nouvel utilisateur avec le rôle spécifié
    user = new User({ email, password: hashedPassword, role: userRole ,name});
    await user.save();

    // Création d'un jeton JWT
    const payload = { userId: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ token, userId: user.id, role: user.role });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error while registering' });
  }
});

router.get('/getall', auth, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find();
    if (!users) {
      return res.status(404).json({ message: 'No users found' });
    }
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});



// Login route
router.post('/login', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  try {
    // Recherche de l'utilisateur dans la base de données
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Comparaison des mots de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Création d'un jeton JWT
    const payload = { userId: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, userId: user.id, role: user.role });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error while logging in' });
  }
});

module.exports = router;
router.get('/check-login', userController.checkLogin);
router.get('/profile', auth, userController.getUserProfile);
router.put('/profile', auth, userController.updateUserProfile);
router.get('/', auth, verifyAdmin, userController.getAllUsers);
router.put('/:id/updateUserRole', auth, verifyAdmin, userController.updateUserRole);
router.delete('/:id/deleteUser', auth,  verifyAdmin, userController.deleteUser);
router.post('/logout', auth, userController.logout);
module.exports = router;
