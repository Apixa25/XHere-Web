// Add this to your existing locationRoutes.js file

// PUT /api/locations/:id - Update location
router.put('/:id', auth, upload.array('media'), async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Check if the user owns this location
    if (location.creator.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this location' });
    }

    // Update text content if provided
    if (req.body.text) {
      location.content.text = req.body.text;
    }

    // Update media if provided
    if (req.files && req.files.length > 0) {
      const mediaUrls = req.files.map(file => file.path.replace('\\', '/'));
      const mediaTypes = req.files.map(file => file.mimetype);
      
      location.content.mediaUrls = mediaUrls;
      location.content.mediaTypes = mediaTypes;
    }

    await location.save();
    res.json(location);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Server error' });
  }
}); 