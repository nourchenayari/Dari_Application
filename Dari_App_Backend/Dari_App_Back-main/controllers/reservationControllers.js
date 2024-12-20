const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const House = require('../models/House');
const User = require('../models/User');

// Créer une réservation
exports.createReservation = async (req, res) => {
  const { checkInDate, checkOutDate } = req.body;
  const { houseId } = req.params;
  const userId = req.user.userId;

  try {
    // Vérifier si la maison existe
    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({ message: 'Maison non trouvée' });
    }
    if (house.userId == userId) {
      return res.status(400).json({ message: 'Vous ne pouvez pas réserver votre propre maison' });
    }

    // Vérifier s'il y a des conflits avec les dates
    const existingReservation = await Reservation.findOne({
      house: houseId,
      $or: [
        // Si les dates se chevauchent
        { 
          checkInDate: { $lt: checkOutDate },  // La réservation commence avant la nouvelle date de fin
          checkOutDate: { $gt: checkInDate },  // La réservation finit après la nouvelle date de début
        }
      ],
    });
    
    if (existingReservation) {
      return res.status(400).json({ message: 'La maison est déjà réservée pour ces dates.' });
    }
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const timeDifference = checkOut - checkIn; // La différence en millisecondes
    const days = timeDifference / (1000 * 3600 * 24); // Convertir la différence en jours

    let totalPrice = 0;
    let currentDate = new Date(checkIn);
    let months = 0;

    // Calcul du nombre de mois complets
    while (currentDate < checkOut) {
      let nextMonthDate = new Date(currentDate);
      nextMonthDate.setMonth(currentDate.getMonth() + 1);

      if (nextMonthDate <= checkOut) {
        months++;
        currentDate = nextMonthDate;
      } else {
        break;
      }
    }

    // Calcul des jours restants après les mois complets
    const remainingDays = (checkOut - currentDate) / (1000 * 3600 * 24);

    // Calcul du prix total
    if (months > 0 && remainingDays === 0 && house.pricePerMonth) {
      // Exactement un ou plusieurs mois
      totalPrice = house.pricePerMonth * months;
    } else if (months > 0 && remainingDays > 0 && house.pricePerMonth && house.pricePerNight) {
      // Mois complets et jours supplémentaires
      totalPrice = (house.pricePerMonth * months) + (house.pricePerNight * remainingDays);
    } else if (remainingDays > 0 && house.pricePerNight) {
      // Uniquement des jours
      totalPrice = house.pricePerNight * days;
    } else {
      return res.status(400).json({ message: 'Aucun prix défini pour cette maison.' });
    }

    

    // Créer la réservation si la maison est disponible
    const reservation = new Reservation({
      user: userId,
      house: houseId,
      price: totalPrice,
      checkInDate,
      checkOutDate,
      status: 'pending',
    });

    await reservation.save();

    res.status(201).json({
      message: 'Réservation effectuée avec succès',
      reservation,
    });
  } catch (error) {
    console.error('Erreur lors de la création de la réservation:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la réservation', error: error.message });
  }
};

// Récupérer toutes les réservations d'un utilisateur
exports.getUserReservations = async (req, res) => {
  const userId = req.user.userId;

  try {
    const reservations = await Reservation.find({ user: userId }).populate('house');
    res.status(200).json(reservations);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des réservations', error: error.message });
  }
};

// Récupérer toutes les réservations d'une maison spécifique
exports.getHouseReservations = async (req, res) => {
  const { houseId } = req.params;
  
  if (!req.user) {
    return res.status(403).json({ message: 'Utilisateur non authentifié' });
  }

  try {
    const house = await House.findById(houseId);
    
    if (!house) {
      return res.status(404).json({ message: 'Maison non trouvée' });
    }

    if (house.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Accès interdit, vous n\'êtes pas le propriétaire de cette maison' });
    }
    const reservations = await Reservation.find({ house: houseId }).populate('user');
    res.status(200).json(reservations);

  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des réservations de la maison', error: error.message });
  }
};

// Annuler une réservation
exports.cancelReservation = async (req, res) => {
  const { id } = req.params;

  try {
    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    if (reservation.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à annuler cette réservation' });
    }

    reservation.status = 'cancelled';
    await reservation.save();

    res.status(200).json({ message: 'Réservation annulée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'annulation de la réservation', error: error.message });
  }
};

//update
exports.updateReservation = async (req, res) => {
  const { id } = req.params;
  const { checkInDate, checkOutDate, status } = req.body; 

  try {
    // Vérifier si la réservation existe
    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // Vérifier si la réservation est annulée
    if (reservation.status === 'cancelled') {
      return res.status(400).json({ message: 'Cette réservation a été annulée et ne peut pas être modifiée' });
    }

    // Vérifier si l'utilisateur est celui qui a réservé
    if (reservation.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier cette réservation' });
    }

    // Vérifier la disponibilité de la maison pour les nouvelles dates
    const existingReservation = await Reservation.findOne({
      house: reservation.house,
      _id: { $ne: id },
      $or: [
        {
          checkInDate: { $lt: checkOutDate }, // La nouvelle réservation commence avant la date de fin d'une autre réservation
          checkOutDate: { $gt: checkInDate }  // La nouvelle réservation finit après la date de début d'une autre réservation
        }
      ]
    });

    if (existingReservation) {
      return res.status(400).json({ message: 'La maison est déjà réservée pour ces dates.' });
    }

    // Mettre à jour les informations de la réservation avec les nouvelles dates, si fournies
    reservation.checkInDate = checkInDate || reservation.checkInDate;
    reservation.checkOutDate = checkOutDate || reservation.checkOutDate;
    reservation.status = status || reservation.status; 

    // Sauvegarder la réservation mise à jour
    await reservation.save();

    res.status(200).json({
      message: 'Réservation mise à jour avec succès',
      reservation
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la réservation:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la réservation', error: error.message });
  }
};