const express = require('express');
const House = require('../models/House');

exports.getAllHouses = async (req, res) => {
  try {
    const houses = await House.find();  
    res.status(200).json(houses);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des maisons', error });
  }
};

exports.getHouseById = async (req, res) => {
  try {
    const house = await House.findOne({ _id: req.params.id, status: 'approved' });
    if (!house) return res.status(404).json({ message: 'Maison non trouvée ou non approuvée' });
    res.status(200).json(house);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de la maison', error });
  }
};

exports.getAllHousesByUser = async (req, res) => {
  try {
    const houses = await House.find({ userId: req.user.userId}); 
    if (houses.length === 0) {
      return res.status(404).json({ message: 'Aucune maison approuvée trouvée pour cet utilisateur' });
    }

    res.status(200).json(houses);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des maisons', error: error.message });
  }
};

  
// Ajouter une nouvelle maison
exports.addHouse = async (req, res) => {
  const { title, type , description, location, pricePerNight, pricePerMonth, surface, bedrooms, bathrooms, images, isAvailable } = req.body;

  // Validation des champs obligatoires
  if (!title ||!type || !description || !location|| !pricePerNight || !surface || !bedrooms || !bathrooms || !images) {
    return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis' });
  }

  // Vérification de la validité des prix
  if (pricePerMonth && pricePerMonth <= 0) {
    return res.status(400).json({ message: 'Le prix par mois doit être supérieur à 0' });
  }

  if (pricePerNight <= 0) {
    return res.status(400).json({ message: 'Le prix par nuit doit être supérieur à 0' });
  }
  if (bedrooms <= 0 || bathrooms <= 0) {
    return res.status(400).json({ message: 'Le nombre de chambres et de salles de bain doit être supérieur à 0' });
  }
  if (surface <= 0) {
    return res.status(400).json({ message: 'Le surface doit être supérieur à 0' });
  }
  
  try {
    // Création d'une nouvelle maison avec les informations fournies
    const newHouse = new House({
      title,
      type,
      description,
      location,
      pricePerNight,
      pricePerMonth,
      surface,
      bedrooms,
      bathrooms, 
      images,
      isAvailable,
      userId: req.user.userId,  
    });
    await newHouse.save();

    const houseResponse = {
      title: newHouse.title,
      type: newHouse.type,
      description: newHouse.description,
      location: newHouse.location,
      pricePerNight: newHouse.pricePerNight,
      pricePerMonth: newHouse.pricePerMonth,
      surface: newHouse.surface,
      bedrooms: newHouse.bedrooms,
      bathrooms: newHouse.bathrooms,
      images: newHouse.images,
      isAvailable: newHouse.isAvailable,
      userId: newHouse.userId,
    };

    res.status(201).json({
      message: 'Maison ajoutée avec succès',
      house: houseResponse,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'ajout de la maison', details: error.message });
  }
};

// Mettre à jour une maison
exports.updateHouse = async (req, res) => {
    try {
      // Trouver la maison par ID
      const house = await House.findById(req.params.id);
      
      // Vérifier si la maison existe
      if (!house) {
        return res.status(404).json({ message: 'Maison non trouvée' });
      }
  
      // Vérifier si l'utilisateur authentifié est le créateur de la maison
      if (house.userId.toString() !== req.user.userId) {
        return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à mettre à jour cette maison' });
      }
  
      // Mettre à jour la maison
      const updatedHouse = await House.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updatedHouse) {
        return res.status(400).json({ message: 'Erreur lors de la mise à jour de la maison. Veuillez vérifier les données envoyées.' });
      }
  
      res.status(200).json(updatedHouse);
    } catch (error) {
      // Ajouter des détails sur l'erreur pour faciliter le débogage
      console.error("Erreur lors de la mise à jour de la maison:", error.message);
      res.status(500).json({ message: 'Erreur interne du serveur lors de la mise à jour de la maison', error: error.message });
    }
  };
  
  
// Supprimer une maison
exports.deleteHouse = async (req, res) => {
  try {
    // Find the house by ID
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ message: 'Maison non trouvée' });

    // Allow admins to delete any house
    if (req.user.role === 'admin' || house.userId.toString() === req.user.userId) {
      // Delete the house
      await House.findByIdAndDelete(req.params.id);
      return res.status(200).json({ message: 'Maison supprimée avec succès' });
    } else {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer cette maison' });
    }
  } catch (error) {
    console.error('Error deleting house:', error.message);
    res.status(500).json({ message: 'Erreur lors de la suppression de la maison', error: error.message });
  }
};

const nlp = require('compromise');  

function extractSearchCriteria(query) {
  let criteria = {};

  const places = nlp(query).places().out('array');
  if (places.length > 0) {
    criteria.location = places.join(', ');  
  }

  // Extraire les prix
  const prices = nlp(query).numbers().out('array');
  if (prices.length > 0) {
    criteria.price = parseFloat(prices[0]);  
  }

  const bedrooms = nlp(query).match('#Value+ chambres').out('array');
  if (bedrooms.length > 0) {
    criteria.bedrooms = parseInt(bedrooms[0].match(/\d+/)[0]);  
  }
  

  return criteria;
}

// Contrôleur pour la recherche de maisons
exports.searchHouses = async (req, res) => {
  try {
    const { query } = req.body; 
    const searchCriteria = extractSearchCriteria(query);

    let filter = {};

    if (searchCriteria.price) {
      filter.pricePerMonth = { $lte: searchCriteria.price };  
    }
    
    if (searchCriteria.bedrooms) {
      filter.bedrooms = { $gte: searchCriteria.bedrooms };
    }

    // Fetch houses from the database based on the filter criteria
    const houses = await House.find(filter);

    if (houses.length === 0) {
      return res.status(404).json({ message: 'Aucune maison trouvée avec les critères spécifiés' });
    }

    // Respond with the found houses
    res.status(200).json(houses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la recherche des maisons', error: error.message });
  }
};
/////partie admin
/*exports.getHousePen = async (req, res) => {
  try {
    const houses = await House.find({ status: 'pending' });  
    res.status(200).json(houses);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des maisons', error });
  }
};
// Approuver une maison
exports.approveHouse = async (req, res) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) {
      return res.status(404).json({ message: 'Maison non trouvée' });
    }

    house.status = 'approved';
    await house.save();
    res.status(200).json({ message: 'Annonce approuvée avec succès.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'approbation de l\'annonce', error: error.message });
  }
};

// Rejeter une maison
exports.rejectHouse = async (req, res) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) {
      return res.status(404).json({ message: 'Maison non trouvée' });
    }

    house.status = 'rejected';
    await house.save();
    res.status(200).json({ message: 'Annonce rejetée avec succès.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du rejet de l\'annonce', error: error.message });
  }
};*/