const express = require("express");
const Attorney = require("../models/Attorney");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// Helper function to get full image URL
const getFullImageUrl = (filename) => {
    if (!filename) return null;
    // If already a full URL, return as is
    if (filename.startsWith('http')) return filename;
    // Your actual domain without 'api.'
    const baseUrl = process.env.BASE_URL || "https://kormordon.com";
    return `${baseUrl}/uploads/${filename}`;
};

// Get all attorneys
router.get("/", async (req, res) => {
    try {
        const attorneys = await Attorney.find().sort("name");
        res.json(attorneys);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single attorney
router.get("/:id", async (req, res) => {
    try {
        const attorney = await Attorney.findById(req.params.id);
        if (!attorney) {
            return res.status(404).json({ error: "Attorney not found" });
        }
        res.json(attorney);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create attorney (admin only)
router.post("/", auth, upload.single("image"), async (req, res) => {
    try {
        console.log("=== CREATE ATTORNEY ===");
        console.log("Body data:", req.body.data);
        console.log("File:", req.file);
        
        const attorneyData = JSON.parse(req.body.data);
        
        // Handle image upload
        if (req.file) {
            // Store only the filename (not full URL)
            attorneyData.image = req.file.filename;
            console.log("Image filename saved:", attorneyData.image);
        } else {
            console.log("No image uploaded");
        }
        
        const attorney = new Attorney(attorneyData);
        await attorney.save();
        
        // Convert to full URL for response
        const attorneyObj = attorney.toObject();
        if (attorneyObj.image) {
            attorneyObj.imageUrl = getFullImageUrl(attorneyObj.image);
        }
        
        console.log("Attorney created with ID:", attorney._id);
        res.status(201).json(attorneyObj);
    } catch (error) {
        console.error("Create attorney error:", error);
        res.status(400).json({ error: error.message });
    }
});

// Update attorney (admin only)
router.put("/:id", auth, upload.single("image"), async (req, res) => {
    try {
        console.log("=== UPDATE ATTORNEY ===");
        console.log("ID:", req.params.id);
        console.log("Has file:", !!req.file);
        if (req.file) {
            console.log("File name:", req.file.filename);
            console.log("File path:", req.file.path);
        }
        console.log("Request body data:", req.body.data);
        
        const attorneyData = JSON.parse(req.body.data);
        const existingAttorney = await Attorney.findById(req.params.id);
        
        if (!existingAttorney) {
            return res.status(404).json({ error: "Attorney not found" });
        }
        
        let finalImageFilename = existingAttorney.image; // Default to existing
        
        // Case 1: Remove existing image
        if (attorneyData.removeImage === true) {
            console.log("Removing existing image");
            if (existingAttorney.image) {
                const oldImagePath = path.join(__dirname, "..", "uploads", existingAttorney.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                    console.log("Deleted old image");
                }
            }
            finalImageFilename = null;
        }
        
        // Case 2: Upload new image (this takes priority over remove)
        if (req.file) {
            console.log("Uploading new image:", req.file.filename);
            
            // Delete old image if exists (and not already deleted)
            if (existingAttorney.image && !attorneyData.removeImage) {
                const oldImagePath = path.join(__dirname, "..", "uploads", existingAttorney.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                    console.log("Deleted old image before new upload");
                }
            }
            finalImageFilename = req.file.filename;
        }
        
        // Update the image field in attorneyData
        attorneyData.image = finalImageFilename;
        
        // Remove temporary flag
        delete attorneyData.removeImage;
        
        console.log("Final image filename to save:", attorneyData.image);
        
        // Update all fields including image
        const updatedAttorney = await Attorney.findByIdAndUpdate(
            req.params.id,
            {
                name: attorneyData.name,
                bio: attorneyData.bio,
                specialization: attorneyData.specialization,
                experience: attorneyData.experience,
                email: attorneyData.email,
                phone: attorneyData.phone,
                education: attorneyData.education,
                barCertification: attorneyData.barCertification,
                image: attorneyData.image
            },
            { new: true, runValidators: true }
        );
        
        console.log("Update successful. New image filename:", updatedAttorney.image);
        console.log("=== END UPDATE ===");
        
        // Convert to full URL for response
        const attorneyObj = updatedAttorney.toObject();
        if (attorneyObj.image) {
            attorneyObj.imageUrl = getFullImageUrl(attorneyObj.image);
        }
        
        res.json(attorneyObj);
    } catch (error) {
        console.error("Update attorney error:", error);
        res.status(400).json({ error: error.message });
    }
});

// Delete attorney (admin only)
router.delete("/:id", auth, async (req, res) => {
    try {
        const attorney = await Attorney.findById(req.params.id);
        if (!attorney) {
            return res.status(404).json({ error: "Attorney not found" });
        }
        
        // Delete associated image file
        if (attorney.image) {
            const imagePath = path.join(__dirname, "..", "uploads", attorney.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log("Deleted image file:", imagePath);
            }
        }
        
        await Attorney.findByIdAndDelete(req.params.id);
        res.json({ message: "Attorney deleted successfully" });
    } catch (error) {
        console.error("Delete attorney error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;