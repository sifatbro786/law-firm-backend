const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Admin = require("../models/Admin");
const authMiddleware = require("../middleware/auth");
const { sendPasswordResetEmail, sendPasswordChangeConfirmation } = require("../utils/emailService");
const router = express.Router();

// Initialize super admin if not exists
const initSuperAdmin = async () => {
    try {
        const superAdminExists = await Admin.findOne({ role: "super_admin" });
        if (!superAdminExists) {
            const superAdmin = new Admin({
                name: "Super Admin",
                email: process.env.SUPER_ADMIN_EMAIL || "superadmin@lawfirm.com",
                password: process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin123!",
                role: "super_admin",
                isActive: true,
            });
            await superAdmin.save();
            console.log("Super Admin user created");
        }
    } catch (error) {
        console.error("Error creating super admin:", error);
    }
};
initSuperAdmin();

// Generate secure random token
const generateSecureToken = () => {
    // Generate 5-digit random number using crypto
    const min = 10000;
    const max = 99999;
    const range = max - min + 1;
    const randomBytes = crypto.randomBytes(4);
    const randomNumber = min + (randomBytes.readUInt32BE(0) % range);
    return randomNumber.toString();
};

// Register new admin (only super admin can create new admins)
router.post("/register", authMiddleware, async (req, res) => {
    try {
        const requester = await Admin.findById(req.adminId);
        if (requester.role !== "super_admin") {
            return res
                .status(403)
                .json({ error: "Only super admin can create new admin accounts" });
        }

        const { name, email, password, role } = req.body;

        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ error: "Admin with this email already exists" });
        }

        const newAdmin = new Admin({
            name,
            email,
            password,
            role: role || "admin",
            isActive: true,
        });

        await newAdmin.save();

        res.status(201).json({
            message: "Admin created successfully",
            admin: {
                id: newAdmin._id,
                name: newAdmin.name,
                email: newAdmin.email,
                role: newAdmin.role,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email, isActive: true });
        if (!admin) {
            return res.status(401).json({ error: "Invalid credentials or account inactive" });
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        admin.lastLogin = new Date();
        await admin.save();

        const token = jwt.sign(
            { adminId: admin._id, email: admin.email, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" },
        );

        res.json({
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Forgot password - send reset token (using crypto)
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        const admin = await Admin.findOne({ email, isActive: true });

        if (!admin) {
            return res.status(404).json({ error: "No account found with this email" });
        }

        // Generate secure 5-digit reset token using crypto
        const generateSecureToken = () => {
            const min = 10000;
            const max = 99999;
            const range = max - min + 1;
            const randomBytes = crypto.randomBytes(4);
            const randomNumber = min + (randomBytes.readUInt32BE(0) % range);
            return randomNumber.toString();
        };

        const resetToken = generateSecureToken();

        // Set token expiry (10 minutes)
        admin.resetPasswordToken = resetToken;
        admin.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
        await admin.save();

        // Send email with token
        try {
            await sendPasswordResetEmail(admin.email, resetToken, admin.name);
            res.json({ message: "Password reset code sent to your email" });
        } catch (emailError) {
            console.error("Email sending failed:", emailError);
            // Still return success to user, but log the error
            res.json({
                message: "If an account exists with this email, you will receive a reset code.",
            });
        }
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ error: "Internal server error. Please try again later." });
    }
});

// Verify reset token
router.post("/verify-reset-token", async (req, res) => {
    try {
        const { email, token } = req.body;
        const admin = await Admin.findOne({
            email,
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!admin) {
            return res.status(400).json({ error: "Invalid or expired reset code" });
        }

        res.json({ message: "Token verified successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reset password
router.post("/reset-password", async (req, res) => {
    try {
        const { email, token, newPassword } = req.body;
        const admin = await Admin.findOne({
            email,
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!admin) {
            return res.status(400).json({ error: "Invalid or expired reset code" });
        }

        // Update password
        admin.password = newPassword;
        admin.resetPasswordToken = undefined;
        admin.resetPasswordExpires = undefined;
        await admin.save();

        // Send confirmation email
        await sendPasswordChangeConfirmation(admin.email, admin.name);

        res.json({ message: "Password reset successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Change password (logged in user)
router.post("/change-password", authMiddleware, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const admin = await Admin.findById(req.adminId);

        const isMatch = await admin.comparePassword(oldPassword);
        if (!isMatch) {
            return res.status(401).json({ error: "Current password is incorrect" });
        }

        admin.password = newPassword;
        await admin.save();

        await sendPasswordChangeConfirmation(admin.email, admin.name);

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Super admin change any admin's password
router.post("/change-password/:id", authMiddleware, async (req, res) => {
    try {
        const requester = await Admin.findById(req.adminId);
        if (requester.role !== "super_admin") {
            return res
                .status(403)
                .json({ error: "Only super admin can change other admin's password" });
        }

        const { newPassword } = req.body;
        const admin = await Admin.findById(req.params.id);

        if (!admin) {
            return res.status(404).json({ error: "Admin not found" });
        }

        admin.password = newPassword;
        await admin.save();

        await sendPasswordChangeConfirmation(admin.email, admin.name);

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get current admin profile
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const admin = await Admin.findById(req.adminId).select(
            "-password -resetPasswordToken -resetPasswordExpires",
        );
        if (!admin) {
            return res.status(404).json({ error: "Admin not found" });
        }
        res.json(admin);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all admins (only super admin)
router.get("/admins", authMiddleware, async (req, res) => {
    try {
        const requester = await Admin.findById(req.adminId);
        if (requester.role !== "super_admin") {
            return res.status(403).json({ error: "Only super admin can view all admins" });
        }

        const admins = await Admin.find().select(
            "-password -resetPasswordToken -resetPasswordExpires",
        );
        res.json(admins);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update admin status (activate/deactivate) - only super admin
router.patch("/admins/:id/status", authMiddleware, async (req, res) => {
    try {
        const requester = await Admin.findById(req.adminId);
        if (requester.role !== "super_admin") {
            return res.status(403).json({ error: "Only super admin can update admin status" });
        }

        const { isActive } = req.body;
        const admin = await Admin.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true },
        ).select("-password -resetPasswordToken -resetPasswordExpires");

        if (!admin) {
            return res.status(404).json({ error: "Admin not found" });
        }

        res.json({ message: "Admin status updated", admin });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete admin (only super admin)
router.delete("/admins/:id", authMiddleware, async (req, res) => {
    try {
        const requester = await Admin.findById(req.adminId);
        if (requester.role !== "super_admin") {
            return res.status(403).json({ error: "Only super admin can delete admins" });
        }

        const admin = await Admin.findByIdAndDelete(req.params.id);
        if (!admin) {
            return res.status(404).json({ error: "Admin not found" });
        }

        res.json({ message: "Admin deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
