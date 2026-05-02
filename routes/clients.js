const express = require("express");
const Client = require("../models/Client");
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

// Get all clients
router.get("/", async (req, res) => {
    try {
        const clients = await Client.find().sort({ createdAt: -1 });
        res.json(clients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create client - with removeImage support for consistency
router.post("/", auth, upload.single("brandImage"), async (req, res) => {
    try {
        const clientData = { brandName: req.body.brandName };
        if (req.file) {
            clientData.brandImage = `/uploads/${req.file.filename}`;
        }

        const client = new Client(clientData);
        await client.save();
        res.status(201).json(client);
    } catch (error) {
        // Delete uploaded file if save fails
        if (req.file) {
            deleteImageFile(req.file.filename);
        }
        res.status(400).json({ error: error.message });
    }
});

// Update client - with removeImage support
router.put("/:id", auth, upload.single("brandImage"), async (req, res) => {
    try {
        const existing = await Client.findById(req.params.id);
        if (!existing) {
            if (req.file) deleteImageFile(req.file.filename);
            return res.status(404).json({ error: "Client not found" });
        }

        const updateData = { brandName: req.body.brandName };

        // Check if removeImage flag is true
        if (req.body.removeImage === "true" || req.body.removeImage === true) {
            // Delete existing image file
            if (existing.brandImage) {
                deleteImageFile(existing.brandImage);
                updateData.brandImage = "";
            }
        }
        // If new image is uploaded
        else if (req.file) {
            // Delete old image
            if (existing.brandImage) {
                deleteImageFile(existing.brandImage);
            }
            updateData.brandImage = `/uploads/${req.file.filename}`;
        }
        // If no image change, keep existing (don't send image field)
        else {
            // Don't update image field
            delete updateData.brandImage;
        }

        const updated = await Client.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        });
        res.json(updated);
    } catch (error) {
        if (req.file) deleteImageFile(req.file.filename);
        res.status(400).json({ error: error.message });
    }
});

// Delete client
router.delete("/:id", auth, async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ error: "Client not found" });

        // Delete image file
        if (client.brandImage) {
            deleteImageFile(client.brandImage);
        }

        await Client.findByIdAndDelete(req.params.id);
        res.json({ message: "Client deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
