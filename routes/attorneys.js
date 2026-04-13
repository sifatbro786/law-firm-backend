const express = require("express");
const Attorney = require("../models/Attorney");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const router = express.Router();

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
        const attorneyData = JSON.parse(req.body.data);
        if (req.file) {
            attorneyData.image = `/uploads/${req.file.filename}`;
        }
        const attorney = new Attorney(attorneyData);
        await attorney.save();
        res.status(201).json(attorney);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update attorney (admin only)
router.put("/:id", auth, upload.single("image"), async (req, res) => {
    try {
        const attorneyData = JSON.parse(req.body.data);
        if (req.file) {
            attorneyData.image = `/uploads/${req.file.filename}`;
        }
        const attorney = await Attorney.findByIdAndUpdate(req.params.id, attorneyData, {
            new: true,
            runValidators: true,
        });
        if (!attorney) {
            return res.status(404).json({ error: "Attorney not found" });
        }
        res.json(attorney);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete attorney (admin only)
router.delete("/:id", auth, async (req, res) => {
    try {
        const attorney = await Attorney.findByIdAndDelete(req.params.id);
        if (!attorney) {
            return res.status(404).json({ error: "Attorney not found" });
        }
        res.json({ message: "Attorney deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
