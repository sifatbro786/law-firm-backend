const express = require("express");
const Attorney = require("../models/Attorney");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// Get all attorneys
router.get("/", async (req, res) => {
    try {
        const attorneys = await Attorney.find().sort({ order: 1, name: 1 });
        res.json(attorneys);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// IMPORTANT: Specific routes MUST come before parameterized routes
// Bulk update attorney orders (admin only)
router.put("/reorder", auth, async (req, res) => {
    try {
        console.log("=== REORDER ATTORNEYS ===");
        const { orders } = req.body; // [{ id: "attorney_id", order: 0 }, ...]

        if (!Array.isArray(orders)) {
            return res.status(400).json({ error: "orders must be an array" });
        }

        console.log(`Reordering ${orders.length} attorneys`);

        // Bulk update multiple attorneys
        const bulkOps = orders.map((item) => ({
            updateOne: {
                filter: { _id: item.id },
                update: { order: item.order },
            },
        }));

        await Attorney.bulkWrite(bulkOps);

        // Return updated attorneys sorted by new order
        const updatedAttorneys = await Attorney.find().sort({ order: 1, name: 1 });
        console.log("Reorder completed successfully");
        res.json(updatedAttorneys);
    } catch (error) {
        console.error("Reorder attorneys error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get single attorney - THIS MUST COME AFTER specific routes
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
            const fullImageUrl = `/uploads/${req.file.filename}`;
            attorneyData.image = fullImageUrl;
            console.log("Full URL saved to database:", attorneyData.image);
        } else {
            console.log("No image uploaded");
        }

        // Get the highest order number and add 1
        const lastAttorney = await Attorney.findOne().sort("-order");
        attorneyData.order = lastAttorney ? lastAttorney.order + 1 : 0;
        console.log("New attorney order:", attorneyData.order);

        const attorney = new Attorney(attorneyData);
        await attorney.save();
        console.log("Attorney created with ID:", attorney._id);

        res.status(201).json(attorney);
    } catch (error) {
        console.error("Create attorney error:", error);
        res.status(400).json({ error: error.message });
    }
});

// Update attorney (admin only) - THIS MUST COME AFTER specific routes
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

        // Check if this is the reorder route (should not happen now)
        if (req.params.id === "reorder") {
            console.error("ERROR: reorder route being handled by update route!");
            return res.status(400).json({ error: "Invalid attorney ID" });
        }

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
            finalImageUrl = `/uploads/${req.file.filename}`;
        }

        // Update the image field
        attorneyData.image = finalImageUrl;
        delete attorneyData.removeImage;

        console.log("Final full URL to save:", attorneyData.image);

        // IMPORTANT: Preserve the existing order
        // Don't include order in the update
        const updatedAttorney = await Attorney.findByIdAndUpdate(
            req.params.id,
            {
                name: attorneyData.name,
                bio: attorneyData.bio,
                specialization: attorneyData.specialization,
                designation: attorneyData.designation,
                quote: attorneyData.quote,
                experience: attorneyData.experience,
                email: attorneyData.email,
                phone: attorneyData.phone,
                education: attorneyData.education,
                barCertification: attorneyData.barCertification,
                image: attorneyData.image,
                // order field is NOT updated here - it stays the same
            },
            { new: true, runValidators: true },
        );

        console.log("Update successful. Order preserved:", updatedAttorney.order);
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
            // Extract filename from URL
            const filename = path.basename(attorney.image);
            const imagePath = path.join(__dirname, "..", "uploads", filename);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log("Deleted image file:", imagePath);
            }
        }

        const deletedOrder = attorney.order;
        await Attorney.findByIdAndDelete(req.params.id);

        // Reorder remaining attorneys (decrement orders greater than deleted order)
        await Attorney.updateMany({ order: { $gt: deletedOrder } }, { $inc: { order: -1 } });

        res.json({ message: "Attorney deleted successfully" });
    } catch (error) {
        console.error("Delete attorney error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
