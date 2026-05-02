const express = require("express");
const Gallery = require("../models/Gallery");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// Helper function to delete image file
const deleteImageFile = (imagePath) => {
    if (!imagePath) return;
    const filename = path.basename(imagePath);
    const fullPath = path.join(__dirname, "..", "uploads", filename);
    console.log("Attempting to delete:", fullPath);
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log("Deleted image file:", fullPath);
    }
};

// Get all gallery items
router.get("/", async (req, res) => {
    try {
        const items = await Gallery.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create gallery item
router.post("/", auth, upload.single("image"), async (req, res) => {
    try {
        const itemData = { title: req.body.title };
        if (req.file) {
            itemData.image = `/uploads/${req.file.filename}`;
        }

        const item = new Gallery(itemData);
        await item.save();
        res.status(201).json(item);
    } catch (error) {
        // Delete uploaded file if save fails
        if (req.file) {
            deleteImageFile(req.file.filename);
        }
        res.status(400).json({ error: error.message });
    }
});

// Update gallery item - with removeImage support
router.put("/:id", auth, upload.single("image"), async (req, res) => {
    try {
        const existing = await Gallery.findById(req.params.id);
        if (!existing) {
            if (req.file) deleteImageFile(req.file.filename);
            return res.status(404).json({ error: "Gallery item not found" });
        }

        const updateData = { title: req.body.title };

        // Check if removeImage flag is true
        if (req.body.removeImage === "true" || req.body.removeImage === true) {
            // Delete existing image file
            if (existing.image) {
                deleteImageFile(existing.image);
                updateData.image = "";
            }
        }
        // If new image is uploaded
        else if (req.file) {
            // Delete old image
            if (existing.image) {
                deleteImageFile(existing.image);
            }
            updateData.image = `/uploads/${req.file.filename}`;
        }
        // If no image change, keep existing (don't send image field)
        else {
            // Don't update image field
            delete updateData.image;
        }

        const updated = await Gallery.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        });
        res.json(updated);
    } catch (error) {
        if (req.file) deleteImageFile(req.file.filename);
        res.status(400).json({ error: error.message });
    }
});

// Delete gallery item
router.delete("/:id", auth, async (req, res) => {
    try {
        const item = await Gallery.findById(req.params.id);
        if (!item) return res.status(404).json({ error: "Gallery item not found" });

        // Delete image file
        if (item.image) {
            deleteImageFile(item.image);
        }

        await Gallery.findByIdAndDelete(req.params.id);
        res.json({ message: "Gallery item deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
