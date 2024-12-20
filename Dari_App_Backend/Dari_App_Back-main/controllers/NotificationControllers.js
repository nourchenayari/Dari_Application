const Notification = require('../models/Notification'); // Modèle Notification

// Récupérer toutes les notifications d'un utilisateur
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.userId })
            .sort({ createdAt: -1 });

        if (!notifications || notifications.length === 0) {
            return res.status(200).json({ message: 'Aucune notification trouvée', notifications: [] });
        }
        res.status(200).json({ notifications });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des notifications', error });
    }
};
// Supprimer une notification
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.notificationId);
        if (!notification) {
            return res.status(404).json({ message: 'Notification non trouvée' });
        }
        if (notification.userId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({ message: 'Accès refusé' });
        }

        await notification.remove(); 
        res.status(200).json({ message: 'Notification supprimée avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression de la notification', error });
    }
};
exports.markNotificationAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.notificationId);
        if (!notification) {
            return res.status(404).json({ message: 'Notification non trouvée' });
        }
        if (notification.userId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({ message: 'Accès refusé' });
        }

        notification.isRead = true;
        await notification.save();
        res.status(200).json({ message: 'Notification marquée comme lue', notification });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour de la notification', error });
    }
};

// Marquer une notification comme ignorée
exports.ignoreNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.notificationId);
        if (!notification) {
            return res.status(404).json({ message: 'Notification non trouvée' });
        }
        if (notification.userId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({ message: 'Accès refusé' });
        }

        notification.isIgnored = true; 
        await notification.save();
        res.status(200).json({ message: 'Notification ignorée', notification });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de l\'ignorée de la notification', error });
    }
};
