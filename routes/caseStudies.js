const express = require("express");
const CaseStudy = require("../models/CaseStudy");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const fs = require("fs");
const path = require("path");
const router = express.Router();

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

// Create case study (admin only) - FIXED
router.post("/", auth, upload.single("image"), async (req, res) => {
    try {
        const caseStudyData = JSON.parse(req.body.data);

        // Handle image upload
        if (req.file) {
            caseStudyData.image = `/uploads/${req.file.filename}`;
            console.log("Image saved at:", caseStudyData.image);
        } else {
            console.log("No image uploaded");
            caseStudyData.image = null;
        }

        const caseStudy = new CaseStudy(caseStudyData);
        await caseStudy.save();

        res.status(201).json(caseStudy);
    } catch (error) {
        console.error("Create case study error:", error);
        res.status(400).json({ error: error.message });
    }
});

// Update case study (admin only) - FIXED
router.put("/:id", auth, upload.single("image"), async (req, res) => {
    try {
        const caseStudyData = JSON.parse(req.body.data);
        const existingCaseStudy = await CaseStudy.findById(req.params.id);

        if (!existingCaseStudy) {
            return res.status(404).json({ error: "Case study not found" });
        }

        // Handle image logic
        let finalImagePath = existingCaseStudy.image;

        // Case 1: Remove existing image
        if (caseStudyData.removeImage === true) {
            console.log("Removing existing image");
            if (existingCaseStudy.image) {
                const oldImagePath = path.join(__dirname, "..", existingCaseStudy.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                    console.log("Deleted old image:", oldImagePath);
                }
            }
            finalImagePath = null;
        }

        // Case 2: Upload new image (this takes priority)
        if (req.file) {
            console.log("Uploading new image:", req.file.filename);
            // Delete old image if exists and not already deleted
            if (existingCaseStudy.image && !caseStudyData.removeImage) {
                const oldImagePath = path.join(__dirname, "..", existingCaseStudy.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                    console.log("Deleted old image before new upload");
                }
            }
            finalImagePath = `/uploads/${req.file.filename}`;
        }

        // Update the image field in the data
        caseStudyData.image = finalImagePath;

        // Remove temporary flag
        delete caseStudyData.removeImage;

        console.log("Final image path to save:", caseStudyData.image);

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
            const imagePath = path.join(__dirname, "..", caseStudy.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log("Deleted image file:", imagePath);
            }
        }

        await CaseStudy.findByIdAndDelete(req.params.id);
        res.json({ message: "Case study deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
