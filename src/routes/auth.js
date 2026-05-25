const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

// Sync user from Firebase to local MySQL DB
router.post('/sync', async (req, res) => {
  try {
    const { email, name, avatarUrl } = req.body;
    
    // In a real app, you would verify the Firebase JWT token here
    // before trusting the email and name.
    
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, avatarUrl },
      create: { email, name, avatarUrl }
    });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
