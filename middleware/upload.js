const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("Created uploads directory:", uploadDir);
}

// Base URL - env থেকে নিন
const BASE_URL = process.env.BASE_URL || "https://api.kormondon.com";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // ফাইলের নাম unique করতে পারেন, তবে আপনার ইচ্ছামত রাখুন
        const originalName = file.originalname;
        cb(null, originalName);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error("Only images are allowed (jpeg, jpg, png, gif, webp)"));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter,
});

// হেল্পার ফাংশন - সম্পূর্ণ URL বানানোর জন্য
const getFullImageUrl = (filename) => {
    return `${BASE_URL}/uploads/${filename}`;
};

module.exports = upload;
module.exports.getFullImageUrl = getFullImageUrl;