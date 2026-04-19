const express = require("express");
const Attorney = require("../models/Attorney");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const { getFullImageUrl } = require("../middleware/upload"); // 👈 ইম্পোর্ট করুন
const fs = require("fs");
const path = require("path");
const router = express.Router();

// হেল্পার ফাংশন - attorney ডাটায় সম্পূর্ণ URL যোগ করার জন্য
const addFullImageUrls = (attorney) => {
    const attorneyObj = attorney.toObject ? attorney.toObject() : attorney;
    if (attorneyObj.image) {
        attorneyObj.imageUrl = getFullImageUrl(attorneyObj.image);
        // চাইলে original image path রেখেও দিতে পারেন
        // attorneyObj.imagePath = attorneyObj.image;
    }
    return attorneyObj;
};

// Get all attorneys
router.get("/", async (req, res) => {
    try {
        const attorneys = await Attorney.find().sort("name");
        // প্রতিটি attorney-তে সম্পূর্ণ URL যোগ করুন
        const attorneysWithUrls = attorneys.map(attorney => addFullImageUrls(attorney));
        res.json(attorneysWithUrls);
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
        const attorneyWithUrl = addFullImageUrls(attorney);
        res.json(attorneyWithUrl);
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
            // শুধু relative path সংরক্ষণ করুন (ডাটাবেসে)
            attorneyData.image = `/uploads/${req.file.filename}`;
            console.log("Image saved at:", attorneyData.image);
        } else {
            console.log("No image uploaded");
        }
        
        const attorney = new Attorney(attorneyData);
        await attorney.save();
        
        // Response-এ সম্পূর্ণ URL দিন
        const attorneyWithUrl = addFullImageUrls(attorney);
        res.status(201).json(attorneyWithUrl);
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
        
        let finalImagePath = existingAttorney.image;
        
        // Remove existing image
        if (attorneyData.removeImage === true) {
            console.log("Removing existing image");
            if (existingAttorney.image) {
                const oldImagePath = path.join(__dirname, "..", existingAttorney.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                    console.log("Deleted old image");
                }
            }
            finalImagePath = null;
        }
        
        // Upload new image
        if (req.file) {
            console.log("Uploading new image:", req.file.filename);
            
            if (existingAttorney.image && !attorneyData.removeImage) {
                const oldImagePath = path.join(__dirname, "..", existingAttorney.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                    console.log("Deleted old image before new upload");
                }
            }
            finalImagePath = `/uploads/${req.file.filename}`;
        }
        
        attorneyData.image = finalImagePath;
        delete attorneyData.removeImage;
        
        console.log("Final image path to save:", attorneyData.image);
        
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
        
        console.log("Update successful. New image:", updatedAttorney.image);
        
        // Response-এ সম্পূর্ণ URL দিন
        const attorneyWithUrl = addFullImageUrls(updatedAttorney);
        res.json(attorneyWithUrl);
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
        
        if (attorney.image) {
            const imagePath = path.join(__dirname, "..", attorney.image);
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