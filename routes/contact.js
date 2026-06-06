const express = require("express");
const Contact = require("../models/Contact");
const { sendContactEmail } = require("../utils/emailService2");
const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !message) {
            return res.status(400).json({
                success: false,
                message: "Please fill in all required fields",
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address",
            });
        }

        // Save to database
        const contact = new Contact({
            name,
            email,
            phone,
            message,
        });
        await contact.save();

        // Send email notification to admin
        await sendContactEmail({
            name,
            email,
            phone,
            message,
        });

        res.status(201).json({
            success: true,
            message:
                "Your message has been sent successfully! We'll get back to you within 24 hours.",
        });
    } catch (error) {
        console.error("Contact form error:", error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: "Something went wrong. Please try again later or call us directly.",
        });
    }
});

// Get all contacts (admin only)
router.get("/", async (req, res) => {
    try {
        const contacts = await Contact.find().sort("-createdAt");
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
