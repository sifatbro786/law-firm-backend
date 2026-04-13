const express = require("express");
const Booking = require("../models/Booking");
const { sendBookingEmail } = require("../utils/emailService");
const auth = require("../middleware/auth");
const router = express.Router();

// Create booking
router.post("/", async (req, res) => {
    try {
        const { name, email, phone, date, time, message } = req.body;

        // Check for duplicate booking
        const existingBooking = await Booking.findOne({ date, time });
        if (existingBooking) {
            return res.status(400).json({ error: "This time slot is already booked" });
        }

        const booking = new Booking({ name, email, phone, date, time, message });
        await booking.save();

        // Send email notification
        await sendBookingEmail({ name, email, phone, date, time, message });

        res.status(201).json({ message: "Booking request submitted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all bookings (admin only)
router.get("/", auth, async (req, res) => {
    try {
        const bookings = await Booking.find().sort("-createdAt");
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update booking status (admin only)
router.patch("/:id", auth, async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }
        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
