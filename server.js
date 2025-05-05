const express = require('express');
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require('dotenv').config();

app.use(express.json());
app.use(express.static('public'));

app.post('/create-payment-intent', async (req, res) => {
  const { connectedAccountId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100,
      currency: 'usd',
      application_fee_amount: 20,
      transfer_data: {
        destination: connectedAccountId,
      },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.listen(4242, () => console.log('Server running on port 4242'));
