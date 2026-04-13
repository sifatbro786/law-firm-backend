const express = require("express");
const Contact = require("../models/Contact");
const { sendContactEmail } = require("../utils/emailService");
const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        // Save to database
        const contact = new Contact({ name, email, phone, message });
        await contact.save();

        // Send email notification
        await sendContactEmail({ name, email, phone, message });

        res.status(201).json({ message: "Message sent successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
