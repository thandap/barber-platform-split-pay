const express = require('express');
const path = require('path');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(express.static(path.join(__dirname)));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/create-payment-intent', async (req, res) => {
    const { tipA, tipB } = req.body;
    const baseAmount = 3000 + 3000;
    const total = baseAmount + Math.round(tipA * 100) + Math.round(tipB * 100);

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: total,
            currency: 'usd',
            transfer_group: 'multi_stylist_booking'
        });

        res.send({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (err) {
        console.error("PaymentIntent error:", err.message);
        res.status(500).send({ error: err.message });
    }
});

app.post('/confirm-transfers', async (req, res) => {
    const { paymentIntentId, stylistA, stylistB, tipA, tipB } = req.body;

    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).send({ error: "Payment not complete." });
        }

        await stripe.transfers.create({
            amount: 3000 + Math.round(tipA * 100),
            currency: 'usd',
            destination: stylistA,
            transfer_group: paymentIntent.transfer_group
        });

        await stripe.transfers.create({
            amount: 3000 + Math.round(tipB * 100),
            currency: 'usd',
            destination: stylistB,
            transfer_group: paymentIntent.transfer_group
        });

        res.send({ success: true });
    } catch (err) {
        console.error("Transfer error:", err.message);
        res.status(500).send({ error: err.message });
    }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`💈 Multi-stylist server running on ${PORT}`));
