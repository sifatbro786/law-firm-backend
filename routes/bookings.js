const express = require("express");
const Booking = require("../models/Booking");
const {
    sendBookingEmail,
    sendBookingConfirmationEmail,
    sendBookingCancellationEmail,
} = require("../utils/emailService");
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

        // Send email notification to admin
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

// Update booking status (admin only) - with email notification
router.patch("/:id", auth, async (req, res) => {
    try {
        const { status, cancellationReason } = req.body;

        // Get the booking before update
        const existingBooking = await Booking.findById(req.params.id);
        if (!existingBooking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });

        // Send email based on status change
        if (status === "confirmed" && existingBooking.status !== "confirmed") {
            await sendBookingConfirmationEmail({
                name: booking.name,
                email: booking.email,
                phone: booking.phone,
                date: booking.date,
                time: booking.time,
                message: booking.message,
            });
        } else if (status === "cancelled" && existingBooking.status !== "cancelled") {
            await sendBookingCancellationEmail({
                name: booking.name,
                email: booking.email,
                phone: booking.phone,
                date: booking.date,
                time: booking.time,
                message: booking.message,
                reason: cancellationReason || "No specific reason provided",
            });
        }

        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
