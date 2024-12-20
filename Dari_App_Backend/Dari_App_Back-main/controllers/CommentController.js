const express = require('express');
const Comment = require('../models/Comment');
const House = require('../models/House');
const Notification = require('../models/Notification');

exports.getAllCommentsByHouse = async (req, res) => {
  try {
    if (!req.params.houseId) {
      return res.status(400).json({ message: 'ID de la maison requis' });
    }

    const comments = await Comment.find({ houseId: req.params.houseId, status: 'approved' })
      .populate({
        path: 'userId',
        select: 'name', 
      });

    if (!comments || comments.length === 0) {
      return res.status(404).json({ message: 'Aucun commentaire trouvé pour cette maison' });
    }

    res.status(200).json({
      message: 'Commentaires récupérés avec succès',
      comments,  
    });
  } catch (error) {
    console.error(error); 
    res.status(500).json({ message: 'Erreur lors de la récupération des commentaires', error: error.message });
  }
};

exports.addComment = async (req, res) => {
  const { content, status } = req.body;
  const houseId = req.params.houseId;

  if (!content) {
    return res.status(400).json({ message: 'Le contenu du commentaire est requis' });
  }

  if (!req.user || !req.user.userId) {
    return res.status(403).json({ message: 'Utilisateur non authentifié' });
  }

  try {
    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({ message: 'Maison non trouvée' });
    }

    const { isValid, reason } = validateComment(content);

    if (!isValid) {
      await exports.rejectComment({ params: { id: newComment._id } }, res);
      return res.status(400).json({
        message: 'Le commentaire contient des éléments inappropriés',
        reason: reason,
      });
    }
    const newComment = new Comment({
      content,
      houseId,
      userId: req.user.userId,
      status: 'pending', 
    });

    await newComment.save();
    await exports.approveComment({ params: { id: newComment._id } }, res);

  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'ajout du commentaire', error });
  }
};


exports.updateComment = async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: 'Le contenu du commentaire est requis' });
  }

  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Commentaire non trouvé' });
    }

    if (comment.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier ce commentaire' });
    }

    const { isValid, reason } = validateComment(content);

    if (!isValid) {   
    await exports.rejectComment({ params: { id: newComment._id } }, res);
      return res.status(400).json({
        message: 'Le commentaire contient des éléments inappropriés',
        reason: reason,
      });
    }
    comment.content = content;
    await comment.save();

    res.status(200).json({
      message: 'Commentaire mis à jour avec succès',
      comment,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du commentaire', error });
  }
};


// Supprimer un commentaire
exports.deleteComment = async (req, res) => {
    try {
      const comment = await Comment.findById(req.params.commentId);
  
      if (!comment) {
        return res.status(404).json({ message: 'Commentaire non trouvé' });
      }
  
      if (comment.userId.toString() !== req.user.userId.toString()) {
        return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer ce commentaire' });
      }
  
      await comment.deleteOne();
  
      res.status(200).json({ message: 'Commentaire supprimé avec succès' });
    } catch (error) {
      console.error('Erreur lors de la suppression du commentaire:', error); 
      res.status(500).json({ 
        message: 'Erreur lors de la suppression du commentaire', 
        error: error.message || 'Détails non disponibles'  
      });
    }
  };
  /////partie admin
exports.getCommPen = async (req, res) => {
  try {
    const comments = await Comment.find({ status: 'pending' });  
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des commentaires', error });
  }
};
// Approuver un commentaire
exports.approveComment = async (req, res) => {
  try {
    const commentId = req.params.id;

    const comment = await Comment.findById(commentId).populate({
      path: 'houseId',
      select: 'userId',
      populate: { path: 'userId', select: 'name' },
    }).populate('userId', 'name'); 

    if (!comment) {
      return res.status(404).json({ message: 'Commentaire non trouvé' });
    }

    comment.status = 'approved';
    await comment.save();

    const houseOwnerId = comment.houseId.userId._id; 
    //const houseOwnerName = comment.houseId.userId.name; 
    const commenterName = comment.userId.name; 

    const notificationToOwner = new Notification({
      userId: houseOwnerId, 
      message: `Un nouveau commentaire a été ajouté à votre maison par ${commenterName}.`,
    });

    const notificationToCommenter = new Notification({
      userId: comment.userId._id, 
      message: 'Votre commentaire a été approuvé avec succès.',
    });

    await notificationToOwner.save();
    await notificationToCommenter.save();

    res.status(200).json({ 
      message: 'Commentaire approuvé avec succès et notifications envoyées.' 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur lors de l\'approbation du commentaire', 
      error: error.message 
    });
  }
};


// Rejeter un commentaire
exports.rejectComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Commentaire non trouvée' });
    }

    house.status = 'rejected';
    await house.save();
    const notificationToCommenter = new Notification({
      userId: comment.userId._id, 
      message: 'Advertisement:Votre commentaire a été rejetée!.',
    });
    res.status(200).json({ message: 'Commentaire rejetée avec succès.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du rejet de Commentaire', error: error.message });
  }
};
  
  // Liste des raisons possibles pour rejet
exports.rejectionReasons = {
  offensive: "Contenu offensant ou discriminatoire",
  spam: "Spam ou publicité non autorisée",
  inappropriateLanguage: "Langage inapproprié",
};

const offensiveWords = ['insulte', 'haine', 'violence', 'discrimination', 'racisme'];  // À compléter
const spamWords = ['promo', 'publicité', 'offre', 'gagner', 'cliquez ici'];  // À compléter
const validateComment = (content) => {
  const foundOffensiveWord = offensiveWords.find(word => content.toLowerCase().includes(word));
  if (foundOffensiveWord) {
    return { isValid: false, reason: rejectionReasons.offensive };
  }
  const foundSpamWord = spamWords.find(word => content.toLowerCase().includes(word));
  if (foundSpamWord) {
    return { isValid: false, reason: rejectionReasons.spam };
  }

  if (content.toLowerCase().includes("sale")) {  
    return { isValid: false, reason: rejectionReasons.inappropriateLanguage };
  }
  return { isValid: true, reason: null };
};


