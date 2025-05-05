const express = require('express');
const path = require('path');
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require('dotenv').config();

app.use(express.json());
app.use(express.static('public')); // Optional if you move HTML there

// ✅ Serve index.html on root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/create-payment-intent', async (req, res) => {
  const { connectedAccountId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100, // $1
      currency: 'usd',
      application_fee_amount: 20, // $0.20 for platform
      transfer_data: {
        destination: connectedAccountId,
      },
    });

    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.listen(4242, () => console.log('Server running on port 4242'));
