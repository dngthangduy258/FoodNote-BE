// src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Import routes
const notesRouter = require('./routes/notes');
const reviewsRouter = require('./routes/reviews');

app.use('/api/notes', notesRouter);
app.use('/api/reviews', reviewsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`FoodNote BE listening on port ${PORT}`);
});
