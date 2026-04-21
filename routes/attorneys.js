const express = require("express");
const Attorney = require("../models/Attorney");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// Your actual domain - NO 'api.' subdomain
const BASE_URL = "https://api.kormordon.com";

// Get all attorneys
router.get("/", async (req, res) => {
    try {
        const attorneys = await Attorney.find().sort("order name");
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
        
        // Handle image upload - Save FULL URL in database
        if (req.file) {
            const fullImageUrl = `${BASE_URL}/uploads/${req.file.filename}`;
            attorneyData.image = fullImageUrl;
            console.log("Full URL saved to database:", attorneyData.image);
        } else {
            console.log("No image uploaded");
        }
        
        // সবার শেষে যোগ করার জন্য সর্বোচ্চ order + 1 সেট করুন
        const maxOrderAttorney = await Attorney.findOne().sort("-order");
        attorneyData.order = maxOrderAttorney ? maxOrderAttorney.order + 1 : 0;
        
        const attorney = new Attorney(attorneyData);
        await attorney.save();
        console.log("Attorney created with ID:", attorney._id);
        
        res.status(201).json(attorney);
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

        let finalImageUrl = existingAttorney.image;

        // Case 1: Remove existing image
        if (attorneyData.removeImage === true) {
            console.log("Removing existing image");
            if (existingAttorney.image) {
                // Extract filename from URL
                const filename = path.basename(existingAttorney.image);
                const oldImagePath = path.join(__dirname, "..", "uploads", filename);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                    console.log("Deleted old image");
                }
            }
            finalImageUrl = null;
        }

        // Case 2: Upload new image
        if (req.file) {
            console.log("Uploading new image:", req.file.filename);

            // Delete old image file
            if (existingAttorney.image && !attorneyData.removeImage) {
                const oldFilename = path.basename(existingAttorney.image);
                const oldImagePath = path.join(__dirname, "..", "uploads", oldFilename);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                    console.log("Deleted old image file");
                }
            }

            // Save FULL URL to database
            finalImageUrl = `${BASE_URL}/uploads/${req.file.filename}`;
        }

        // Update the image field
        attorneyData.image = finalImageUrl;
        delete attorneyData.removeImage;

        console.log("Final full URL to save:", attorneyData.image);

        // Update all fields
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

        console.log("Update successful. Image URL in DB:", updatedAttorney.image);
        console.log("=== END UPDATE ===");

        res.json(updatedAttorney);
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
            const filename = path.basename(attorney.image);
            const imagePath = path.join(__dirname, "..", "uploads", filename);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log("Deleted image file:", imagePath);
            }
        }
        
        const deletedOrder = attorney.order;
        await Attorney.findByIdAndDelete(req.params.id);
        
        // মুছে ফেলার পরে বাকি অ্যাটর্নিদের order পুনরায় সাজান (ঐচ্ছিক)
        await Attorney.updateMany(
            { order: { $gt: deletedOrder } },
            { $inc: { order: -1 } }
        );
        
        res.json({ message: "Attorney deleted successfully" });
    } catch (error) {
        console.error("Delete attorney error:", error);
        res.status(500).json({ error: error.message });
    }
});

router.put("/reorder", auth, async (req, res) => {
    try {
        const { orders } = req.body; // [{ id: "attorney_id", order: 0 }, ...]
        
        if (!Array.isArray(orders)) {
            return res.status(400).json({ error: "orders must be an array" });
        }
        
        // Bulk update multiple attorneys
        const bulkOps = orders.map(item => ({
            updateOne: {
                filter: { _id: item.id },
                update: { order: item.order }
            }
        }));
        
        await Attorney.bulkWrite(bulkOps);
        
        // Return updated attorneys sorted by new order
        const updatedAttorneys = await Attorney.find().sort("order name");
        res.json(updatedAttorneys);
        
    } catch (error) {
        console.error("Reorder attorneys error:", error);
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;