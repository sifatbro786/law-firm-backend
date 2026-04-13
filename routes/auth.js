const express = require("express");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const router = express.Router();

// Initialize admin if not exists
const initAdmin = async () => {
    const adminExists = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
    if (!adminExists) {
        const admin = new Admin({
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
        });
        await admin.save();
        console.log("Admin user created");
    }
};
initAdmin();

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ adminId: admin._id, email: admin.email }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        res.json({ token, admin: { email: admin.email } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
