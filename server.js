const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const cron = require("node-cron");
const axios = require("axios");
const fs = require("fs");

// Routes
const authRoutes = require("./routes/auth");
const serviceRoutes = require("./routes/services");
const attorneyRoutes = require("./routes/attorneys");
const contactRoutes = require("./routes/contact");
const bookingRoutes = require("./routes/bookings");
const caseStudyRoutes = require("./routes/caseStudies");
const caseInfoRoutes = require("./routes/caseInfo");
const clientRoutes = require("./routes/clients");
const galleryRoutes = require("./routes/gallery");

dotenv.config();

const app = express();

const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://neela-law-firm.vercel.app",
    "https://neela-law-firm-git-main.vercel.app",
    "https://strsltd.com",
];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) !== -1) {
                return callback(null, true);
            } else {
                console.log("Blocked origin:", origin);
                return callback(null, true);
            }
        },
        credentials: true,
    }),
);

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/attorneys", attorneyRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/case-studies", caseStudyRoutes);
app.use("/api/case-info", caseInfoRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/gallery", galleryRoutes);

app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        uptime: process.uptime(),
        timestamp: new Date(),
    });
});

const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connected successfully");

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    }
};

cron.schedule("*/10 * * * *", async () => {
    try {
        const res = await axios.get("https://law-firm-backend-yuxn.onrender.com/api/health");
        console.log("Ping success:", res.data.status);
    } catch (error) {
        console.error("Ping failed:", error.message);
    }
});

startServer();
