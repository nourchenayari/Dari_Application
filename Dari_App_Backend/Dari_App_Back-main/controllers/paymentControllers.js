const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Reservation = require('../models/Reservation');

exports.initiatePayment = async (req, res) => {
  const { reservationId } = req.params;
  const { amount } = req.body; 

  try {
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: { reservationId: reservation._id.toString() },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      message: 'Paiement initié avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de l\'initiation du paiement:', error);
    res.status(500).json({ message: 'Erreur lors de l\'initiation du paiement', error: error.message });
  }
};

exports.handleWebhook = async (req, res) => {
  const endpointSecret = 'votre_endpoint_secret_stripe';
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
  } catch (error) {
    return res.status(400).json({ message: `Webhook Error: ${error.message}` });
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const reservationId = paymentIntent.metadata.reservationId;

    const reservation = await Reservation.findById(reservationId);
    if (reservation) {
      reservation.paymentStatus = 'paid';
      await reservation.save();
      console.log(`Réservation ${reservationId} marquée comme payée.`);
    }
  }

  res.status(200).json({ received: true });
};
