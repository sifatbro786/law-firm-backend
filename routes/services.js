const express = require("express");
const Service = require("../models/Service");
const auth = require("../middleware/auth");
const router = express.Router();

// Get all services
router.get("/", async (req, res) => {
    try {
        const services = await Service.find().sort("order");
        res.json(services);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single service by slug
router.get("/:slug", async (req, res) => {
    try {
        const service = await Service.findOne({ slug: req.params.slug });
        if (!service) {
            return res.status(404).json({ error: "Service not found" });
        }
        res.json(service);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create service (admin only)
router.post("/", auth, async (req, res) => {
    try {
        const service = new Service(req.body);
        await service.save();
        res.status(201).json(service);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update service (admin only)
router.put("/:id", auth, async (req, res) => {
    try {
        const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!service) {
            return res.status(404).json({ error: "Service not found" });
        }
        res.json(service);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete service (admin only)
router.delete("/:id", auth, async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);
        if (!service) {
            return res.status(404).json({ error: "Service not found" });
        }
        res.json({ message: "Service deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
