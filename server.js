const express = require('express');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require('dotenv').config();

const app = express();
app.use(express.static(path.join(__dirname)));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Create PaymentIntent (without fee)
app.post('/create-payment-intent', async (req, res) => {
  const amountTotal = 6000; // $60.00
  const stylistA = 'acct_XXXXXXX1';
  const stylistB = 'acct_XXXXXXX2';

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountTotal,
      currency: 'usd',
      transfer_group: 'group_booking_xyz',
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      stylistA,
      stylistB,
    });
  } catch (err) {
    console.error('PaymentIntent error:', err.message);
    res.status(500).send({ error: err.message });
  }
});

// Confirm Transfers After Payment
app.post('/confirm-transfers', async (req, res) => {
  const { paymentIntentId, stylistA, stylistB } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).send({ error: 'Payment not completed.' });
    }

    // Split funds manually (no application_fee_amount used)
    await stripe.transfers.create({
      amount: 3000, // $30 to Stylist A
      currency: 'usd',
      destination: stylistA,
      transfer_group: paymentIntent.transfer_group,
    });

    await stripe.transfers.create({
      amount: 3000, // $30 to Stylist B
      currency: 'usd',
      destination: stylistB,
      transfer_group: paymentIntent.transfer_group,
    });

    res.send({ success: true });
  } catch (err) {
    console.error('Transfer error:', err.message);
    res.status(500).send({ error: err.message });
  }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`💈 Barber split-pay server running on port ${PORT}`));
