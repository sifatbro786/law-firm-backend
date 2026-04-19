const express = require("express");
const CaseStudy = require("../models/CaseStudy");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// Your backend API URL
const BASE_URL = "https://api.kormordon.com";

// Helper function to get full image URL
const getFullImageUrl = (filename) => {
    if (!filename) return null;
    // If already a full URL, return as is
    if (filename.startsWith('http')) return filename;
    return `${BASE_URL}/uploads/${filename}`;
};

// Get all case studies (public)
router.get("/", async (req, res) => {
    try {
        const { category, limit = 100 } = req.query;
        let query = { isPublished: true };

        if (category && category !== "all") {
            query.category = category;
        }

        const caseStudies = await CaseStudy.find(query).sort("order").limit(parseInt(limit));
        res.json(caseStudies);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single case study by slug (public)
router.get("/:slug", async (req, res) => {
    try {
        const caseStudy = await CaseStudy.findOne({ slug: req.params.slug, isPublished: true });
        if (!caseStudy) {
            return res.status(404).json({ error: "Case study not found" });
        }
        res.json(caseStudy);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all case studies for admin (including unpublished)
router.get("/admin/all", auth, async (req, res) => {
    try {
        const caseStudies = await CaseStudy.find().sort("-createdAt");
        res.json(caseStudies);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create case study (admin only)
router.post("/", auth, upload.single("image"), async (req, res) => {
    try {
        console.log("=== CREATE CASE STUDY ===");
        console.log("File:", req.file);
        
        const caseStudyData = JSON.parse(req.body.data);

        // Handle image upload - Save FULL URL in database
        if (req.file) {
            const fullImageUrl = getFullImageUrl(req.file.filename);
            caseStudyData.image = fullImageUrl;
            console.log("Full URL saved to database:", caseStudyData.image);
        } else {
            console.log("No image uploaded");
            caseStudyData.image = null;
        }

        const caseStudy = new CaseStudy(caseStudyData);
        await caseStudy.save();

        console.log("Case study created with ID:", caseStudy._id);
        res.status(201).json(caseStudy);
    } catch (error) {
        console.error("Create case study error:", error);
        res.status(400).json({ error: error.message });
    }
});

// Update case study (admin only)
router.put("/:id", auth, upload.single("image"), async (req, res) => {
    try {
        console.log("=== UPDATE CASE STUDY ===");
        console.log("ID:", req.params.id);
        console.log("Has file:", !!req.file);
        
        const caseStudyData = JSON.parse(req.body.data);
        const existingCaseStudy = await CaseStudy.findById(req.params.id);

        if (!existingCaseStudy) {
            return res.status(404).json({ error: "Case study not found" });
        }

        let finalImageUrl = existingCaseStudy.image;

        // Case 1: Remove existing image
        if (caseStudyData.removeImage === true) {
            console.log("Removing existing image");
            if (existingCaseStudy.image) {
                // Extract filename from URL
                const filename = path.basename(existingCaseStudy.image);
                const oldImagePath = path.join(__dirname, "..", "uploads", filename);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                    console.log("Deleted old image:", oldImagePath);
                }
            }
            finalImageUrl = null;
        }

        // Case 2: Upload new image (this takes priority)
        if (req.file) {
            console.log("Uploading new image:", req.file.filename);
            
            // Delete old image if exists and not already deleted
            if (existingCaseStudy.image && !caseStudyData.removeImage) {
                const oldFilename = path.basename(existingCaseStudy.image);
                const oldImagePath = path.join(__dirname, "..", "uploads", oldFilename);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                    console.log("Deleted old image before new upload");
                }
            }
            
            // Save FULL URL to database
            finalImageUrl = getFullImageUrl(req.file.filename);
        }

        // Update the image field in the data
        caseStudyData.image = finalImageUrl;

        // Remove temporary flag
        delete caseStudyData.removeImage;

        console.log("Final full URL to save:", caseStudyData.image);

        // Update all fields explicitly
        const updatedCaseStudy = await CaseStudy.findByIdAndUpdate(
            req.params.id,
            {
                title: caseStudyData.title,
                slug: caseStudyData.slug,
                category: caseStudyData.category,
                client: caseStudyData.client,
                problem: caseStudyData.problem,
                solution: caseStudyData.solution,
                result: caseStudyData.result,
                outcome: caseStudyData.outcome,
                isPublished: caseStudyData.isPublished,
                order: caseStudyData.order,
                image: caseStudyData.image,
            },
            { new: true, runValidators: true },
        );

        console.log("Update successful. Image URL in DB:", updatedCaseStudy.image);
        res.json(updatedCaseStudy);
    } catch (error) {
        console.error("Update case study error:", error);
        res.status(400).json({ error: error.message });
    }
});

// Delete case study (admin only)
router.delete("/:id", auth, async (req, res) => {
    try {
        const caseStudy = await CaseStudy.findById(req.params.id);
        if (!caseStudy) {
            return res.status(404).json({ error: "Case study not found" });
        }

        // Delete associated image file
        if (caseStudy.image) {
            // Extract filename from URL
            const filename = path.basename(caseStudy.image);
            const imagePath = path.join(__dirname, "..", "uploads", filename);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log("Deleted image file:", imagePath);
            }
        }

        await CaseStudy.findByIdAndDelete(req.params.id);
        res.json({ message: "Case study deleted successfully" });
    } catch (error) {
        console.error("Delete case study error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;