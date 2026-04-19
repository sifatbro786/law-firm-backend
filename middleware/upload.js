const multer = require("multer");
const path = require("path");
const fs = require("fs");

// নিশ্চিত করুন uploads ফোল্ডার exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("Created uploads directory:", uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // শুধু আসল নাম রাখুন - কোনো suffix যোগ করবেন না
        // কিন্তু একই নামের ফাইল থাকলে overwrite হবে
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
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter,
});

module.exports = upload;
