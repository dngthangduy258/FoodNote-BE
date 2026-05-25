const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

// Get reviews for a specific note
router.get('/:noteId', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { noteId: req.params.noteId },
      include: {
        user: { select: { name: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a review
router.post('/', async (req, res) => {
  try {
    const { rating, comment, userId, noteId } = req.body;
    
    const newReview = await prisma.review.create({
      data: {
        rating: parseInt(rating),
        comment,
        userId,
        noteId
      },
      include: {
        user: { select: { name: true, avatarUrl: true } }
      }
    });
    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
