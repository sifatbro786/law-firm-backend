// const express = require("express");
// const Service = require("../models/Service");
// const auth = require("../middleware/auth");
// const router = express.Router();
// const upload = require("../middleware/upload");

// // Get all services (sorted by order)
// router.get("/", async (req, res) => {
//     try {
//         const services = await Service.find().sort({ order: 1, title: 1 });
//         res.json(services);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // IMPORTANT: Specific routes MUST come before parameterized routes
// // Bulk update service orders (admin only)
// router.put("/reorder", auth, async (req, res) => {
//     try {
//         console.log("=== REORDER SERVICES ===");
//         const { orders } = req.body; // [{ id: "service_id", order: 0 }, ...]

//         if (!Array.isArray(orders)) {
//             return res.status(400).json({ error: "orders must be an array" });
//         }

//         console.log(`Reordering ${orders.length} services`);

//         // Bulk update multiple services
//         const bulkOps = orders.map((item) => ({
//             updateOne: {
//                 filter: { _id: item.id },
//                 update: { order: item.order },
//             },
//         }));

//         await Service.bulkWrite(bulkOps);

//         // Return updated services sorted by new order
//         const updatedServices = await Service.find().sort({ order: 1, title: 1 });
//         console.log("Reorder completed successfully");
//         res.json(updatedServices);
//     } catch (error) {
//         console.error("Reorder services error:", error);
//         res.status(500).json({ error: error.message });
//     }
// });

// // Get single service by slug - THIS MUST COME AFTER specific routes
// router.get("/:slug", async (req, res) => {
//     try {
//         const service = await Service.findOne({ slug: req.params.slug });
//         if (!service) {
//             return res.status(404).json({ error: "Service not found" });
//         }
//         res.json(service);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // Create service (admin only)
// router.post("/", auth, upload.single("image"), async (req, res) => {
//     try {
//         const lastService = await Service.findOne().sort("-order");
//         const order = lastService ? lastService.order + 1 : 0;

//         const serviceData = {
//             ...req.body,
//             order,
//             image: req.file ? `/uploads/${req.file.filename}` : "",
//         };

//         const service = new Service(serviceData);
//         await service.save();
//         res.status(201).json(service);
//     } catch (error) {
//         res.status(400).json({ error: error.message });
//     }
// });

// // Update service (admin only) - THIS MUST COME AFTER specific routes
// router.put("/:id", auth, upload.single("image"), async (req, res) => {
//     try {
//         if (req.params.id === "reorder") {
//             return res.status(400).json({ error: "Invalid service ID" });
//         }

//         const service = await Service.findById(req.params.id);
//         if (!service) return res.status(404).json({ error: "Service not found" });

//         const updateData = { ...req.body };
//         delete updateData.order;

//         // নতুন image আসলে replace করো, না আসলে পুরনোটা রাখো
//         if (req.file) {
//             updateData.image = `/uploads/${req.file.filename}`;
//         }

//         const updatedService = await Service.findByIdAndUpdate(req.params.id, updateData, {
//             new: true,
//             runValidators: true,
//         });

//         res.json(updatedService);
//     } catch (error) {
//         res.status(400).json({ error: error.message });
//     }
// });

// // Delete service (admin only)
// router.delete("/:id", auth, async (req, res) => {
//     try {
//         const service = await Service.findById(req.params.id);
//         if (!service) {
//             return res.status(404).json({ error: "Service not found" });
//         }

//         const deletedOrder = service.order;
//         await Service.findByIdAndDelete(req.params.id);

//         // Reorder remaining services (decrement orders greater than deleted order)
//         await Service.updateMany({ order: { $gt: deletedOrder } }, { $inc: { order: -1 } });

//         console.log(`Service deleted. Reordered remaining services`);
//         res.json({ message: "Service deleted successfully" });
//     } catch (error) {
//         console.error("Delete service error:", error);
//         res.status(500).json({ error: error.message });
//     }
// });

// module.exports = router;

const express = require("express");
const Service = require("../models/Service");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const deleteImageFile = (imagePath) => {
    if (!imagePath) return;
    const filename = path.basename(imagePath);
    const fullPath = path.join(__dirname, "..", "uploads", filename);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
};

// Get all services (sorted by order)
router.get("/", async (req, res) => {
    try {
        const services = await Service.find().sort({ order: 1, title: 1 });
        res.json(services);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Bulk update service orders (admin only)
router.put("/reorder", auth, async (req, res) => {
    try {
        const { orders } = req.body;
        if (!Array.isArray(orders)) {
            return res.status(400).json({ error: "orders must be an array" });
        }

        const bulkOps = orders.map((item) => ({
            updateOne: {
                filter: { _id: item.id },
                update: { order: item.order },
            },
        }));

        await Service.bulkWrite(bulkOps);
        const updatedServices = await Service.find().sort({ order: 1, title: 1 });
        res.json(updatedServices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single service by slug
router.get("/:slug", async (req, res) => {
    try {
        const service = await Service.findOne({ slug: req.params.slug });
        if (!service) return res.status(404).json({ error: "Service not found" });
        res.json(service);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create service (admin only)
router.post("/", auth, upload.single("image"), async (req, res) => {
    try {
        const lastService = await Service.findOne().sort("-order");
        const order = lastService ? lastService.order + 1 : 0;

        const serviceData = {
            ...req.body,
            order,
            image: req.file ? `/uploads/${req.file.filename}` : "",
        };

        const service = new Service(serviceData);
        await service.save();
        res.status(201).json(service);
    } catch (error) {
        // নতুন file upload হলে কিন্তু save fail হলে সেটাও delete করো
        if (req.file) deleteImageFile(req.file.filename);
        res.status(400).json({ error: error.message });
    }
});

// Update service (admin only)
// Update service (admin only)
router.put("/:id", auth, upload.single("image"), async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            if (req.file) deleteImageFile(req.file.filename);
            return res.status(404).json({ error: "Service not found" });
        }

        const updateData = { ...req.body };
        delete updateData.order;

        // Check if removeImage flag is true
        if (req.body.removeImage === "true" || req.body.removeImage === true) {
            // Delete existing image file
            if (service.image) {
                deleteImageFile(service.image);
                updateData.image = ""; // or null
            }
        }
        // If new image is uploaded
        else if (req.file) {
            // Delete old image file
            if (service.image) {
                deleteImageFile(service.image);
            }
            updateData.image = `/uploads/${req.file.filename}`;
        }
        // If no image change, keep existing image (don't send image field)
        else {
            // Don't update image field, keep existing
            delete updateData.image;
        }

        const updatedService = await Service.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        });

        res.json(updatedService);
    } catch (error) {
        if (req.file) deleteImageFile(req.file.filename);
        res.status(400).json({ error: error.message });
    }
});

// Delete service (admin only)
router.delete("/:id", auth, async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) return res.status(404).json({ error: "Service not found" });

        // Image delete করো
        deleteImageFile(service.image);

        const deletedOrder = service.order;
        await Service.findByIdAndDelete(req.params.id);

        // Reorder remaining
        await Service.updateMany({ order: { $gt: deletedOrder } }, { $inc: { order: -1 } });

        res.json({ message: "Service deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
