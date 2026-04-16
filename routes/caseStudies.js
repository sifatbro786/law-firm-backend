const express = require("express");
const CaseStudy = require("../models/CaseStudy");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
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

// Create case study (admin only)
router.post("/", auth, upload.single("image"), async (req, res) => {
    try {
        const caseStudyData = JSON.parse(req.body.data);
        if (req.file) {
            caseStudyData.image = `/uploads/${req.file.filename}`;
        }
        const caseStudy = new CaseStudy(caseStudyData);
        await caseStudy.save();
        res.status(201).json(caseStudy);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update case study (admin only)
router.put("/:id", auth, upload.single("image"), async (req, res) => {
    try {
        const caseStudyData = JSON.parse(req.body.data);
        if (req.file) {
            caseStudyData.image = `/uploads/${req.file.filename}`;
        }
        const caseStudy = await CaseStudy.findByIdAndUpdate(req.params.id, caseStudyData, {
            new: true,
            runValidators: true,
        });
        if (!caseStudy) {
            return res.status(404).json({ error: "Case study not found" });
        }
        res.json(caseStudy);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete case study (admin only)
router.delete("/:id", auth, async (req, res) => {
    try {
        const caseStudy = await CaseStudy.findByIdAndDelete(req.params.id);
        if (!caseStudy) {
            return res.status(404).json({ error: "Case study not found" });
        }
        res.json({ message: "Case study deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
