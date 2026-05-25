const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

// Helper function to calculate distance using Haversine formula (in meters)
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 9999999;
  const R = 6371e3; // Radius of the earth in m
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in m
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

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

// Create a new note OR convert to review if duplicate
router.post('/', async (req, res) => {
  try {
    const { title, description, imageUrl, isPublic, userId, tags, lat, lng, address, rating } = req.body;
    
    // 1. Check for duplicates (De-duplication logic)
    // Find notes with similar names (simple includes for now)
    const existingNotes = await prisma.note.findMany({
      where: {
        title: {
          contains: title.substring(0, 5) // Simplistic similarity
        }
      }
    });

    let duplicateNote = null;
    for (const note of existingNotes) {
      const distance = getDistanceFromLatLonInMeters(note.lat, note.lng, lat, lng);
      // If within 50 meters and similar name, it's a duplicate!
      if (distance < 50) {
        duplicateNote = note;
        break;
      }
    }

    if (duplicateNote) {
      // 2. Convert to Review instead
      const newReview = await prisma.review.create({
        data: {
          rating: rating || 5, // Default to 5 if not provided in Note form
          comment: description,
          userId: userId,
          noteId: duplicateNote.id
        }
      });
      return res.status(201).json({ 
        message: 'Địa điểm đã tồn tại. Đã tự động chuyển thành bài Đánh giá (Review)!',
        isReview: true,
        data: newReview 
      });
    }

    // 3. Create Note if no duplicate
    const newNote = await prisma.note.create({
      data: {
        title,
        description,
        imageUrl,
        isPublic: isPublic !== undefined ? isPublic : true,
        lat,
        lng,
        address,
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
    res.status(201).json({
      message: 'Tạo địa điểm thành công!',
      isReview: false,
      data: newNote
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle privacy
router.put('/:id/privacy', async (req, res) => {
  try {
    const { isPublic } = req.body;
    const note = await prisma.note.update({
      where: { id: req.params.id },
      data: { isPublic }
    });
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
