const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

// Get comments for a specific review
router.get('/:reviewId', async (req, res) => {
  try {
    const comments = await prisma.reviewComment.findMany({
      where: { reviewId: req.params.reviewId },
      include: {
        user: { select: { name: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a comment to a review
router.post('/', async (req, res) => {
  try {
    const { content, userId, reviewId } = req.body;
    
    const newComment = await prisma.reviewComment.create({
      data: {
        content,
        userId,
        reviewId
      },
      include: {
        user: { select: { name: true, avatarUrl: true } }
      }
    });
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
