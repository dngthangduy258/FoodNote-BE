const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

// Get all public notes
router.get('/', async (req, res) => {
  try {
    const notes = await prisma.note.findMany({
      where: { isPublic: true },
      include: {
        user: { select: { name: true, avatarUrl: true } },
        tags: true,
        _count: { select: { reviews: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new note (requires authentication in a real app)
router.post('/', async (req, res) => {
  try {
    const { title, description, imageUrl, isPublic, userId, tags } = req.body;
    
    const newNote = await prisma.note.create({
      data: {
        title,
        description,
        imageUrl,
        isPublic: isPublic !== undefined ? isPublic : true,
        userId,
        tags: tags ? {
          connectOrCreate: tags.map(tag => ({
            where: { name: tag },
            create: { name: tag }
          }))
        } : undefined
      },
      include: { tags: true }
    });
    res.status(201).json(newNote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
