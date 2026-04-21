const express = require("express");
const Service = require("../models/Service");
const auth = require("../middleware/auth");
const router = express.Router();

// Get all services (sorted by order)
router.get("/", async (req, res) => {
    try {
        const services = await Service.find().sort({ order: 1, title: 1 });
        res.json(services);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// IMPORTANT: Specific routes MUST come before parameterized routes
// Bulk update service orders (admin only)
router.put("/reorder", auth, async (req, res) => {
    try {
        console.log("=== REORDER SERVICES ===");
        const { orders } = req.body; // [{ id: "service_id", order: 0 }, ...]
        
        if (!Array.isArray(orders)) {
            return res.status(400).json({ error: "orders must be an array" });
        }
        
        console.log(`Reordering ${orders.length} services`);
        
        // Bulk update multiple services
        const bulkOps = orders.map(item => ({
            updateOne: {
                filter: { _id: item.id },
                update: { order: item.order }
            }
        }));
        
        await Service.bulkWrite(bulkOps);
        
        // Return updated services sorted by new order
        const updatedServices = await Service.find().sort({ order: 1, title: 1 });
        console.log("Reorder completed successfully");
        res.json(updatedServices);
        
    } catch (error) {
        console.error("Reorder services error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get single service by slug - THIS MUST COME AFTER specific routes
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
        // Get the highest order number and add 1
        const lastService = await Service.findOne().sort('-order');
        const order = lastService ? lastService.order + 1 : 0;
        
        const serviceData = {
            ...req.body,
            order: order
        };
        
        const service = new Service(serviceData);
        await service.save();
        console.log("Service created with order:", service.order);
        
        res.status(201).json(service);
    } catch (error) {
        console.error("Create service error:", error);
        res.status(400).json({ error: error.message });
    }
});

// Update service (admin only) - THIS MUST COME AFTER specific routes
router.put("/:id", auth, async (req, res) => {
    try {
        // Check if this is the reorder route
        if (req.params.id === "reorder") {
            console.error("ERROR: reorder route being handled by update route!");
            return res.status(400).json({ error: "Invalid service ID" });
        }
        
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ error: "Service not found" });
        }
        
        // Create update data without the order field
        const updateData = { ...req.body };
        delete updateData.order; // Remove order if present in request body
        
        // Update the service (order field will NOT be changed)
        const updatedService = await Service.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            {
                new: true,
                runValidators: true,
            }
        );
        
        console.log("Service updated. Order preserved:", updatedService.order);
        res.json(updatedService);
    } catch (error) {
        console.error("Update service error:", error);
        res.status(400).json({ error: error.message });
    }
});

// Delete service (admin only)
router.delete("/:id", auth, async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ error: "Service not found" });
        }
        
        const deletedOrder = service.order;
        await Service.findByIdAndDelete(req.params.id);
        
        // Reorder remaining services (decrement orders greater than deleted order)
        await Service.updateMany(
            { order: { $gt: deletedOrder } },
            { $inc: { order: -1 } }
        );
        
        console.log(`Service deleted. Reordered remaining services`);
        res.json({ message: "Service deleted successfully" });
    } catch (error) {
        console.error("Delete service error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;