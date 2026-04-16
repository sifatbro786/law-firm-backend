const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const CaseInfo = require("../models/CaseInfo");
const auth = require("../middleware/auth");

const router = express.Router();

// Ensure upload directory exists
const uploadDir = "uploads/cases";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Invalid file type. Only images, PDF, Excel, and Word documents are allowed.",
            ),
        );
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
});

// Get all case info with search and pagination (admin only)
router.get("/", auth, async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        let query = {};

        // Search functionality
        if (search) {
            query = {
                $or: [
                    { caseNumber: { $regex: search, $options: "i" } },
                    { clientName: { $regex: search, $options: "i" } },
                    { clientMobileNo: { $regex: search, $options: "i" } },
                    { referenceName: { $regex: search, $options: "i" } },
                    { referenceMobileNo: { $regex: search, $options: "i" } },
                    { district: { $regex: search, $options: "i" } },
                ],
            };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await CaseInfo.countDocuments(query);
        const caseInfos = await CaseInfo.find(query)
            .sort("-createdAt")
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            cases: caseInfos,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            limit: parseInt(limit),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single case info (admin only)
router.get("/:id", auth, async (req, res) => {
    try {
        const caseInfo = await CaseInfo.findById(req.params.id);
        if (!caseInfo) {
            return res.status(404).json({ error: "Case not found" });
        }
        res.json(caseInfo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new case info with file upload (admin only)
router.post("/", auth, upload.array("files", 10), async (req, res) => {
    try {
        const fileData =
            req.files?.map((file) => ({
                originalName: file.originalname,
                fileName: file.filename,
                filePath: file.path,
                fileType: file.mimetype,
                fileSize: file.size,
            })) || [];

        const caseInfo = new CaseInfo({
            ...req.body,
            files: fileData,
        });

        await caseInfo.save();
        res.status(201).json(caseInfo);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update case info with optional file upload (admin only)
router.put("/:id", auth, upload.array("files", 10), async (req, res) => {
    try {
        const caseInfo = await CaseInfo.findById(req.params.id);

        if (!caseInfo) {
            return res.status(404).json({ error: "Case info not found" });
        }

        // Update basic fields
        Object.keys(req.body).forEach((key) => {
            if (key !== "files" && key !== "existingFiles") {
                caseInfo[key] = req.body[key];
            }
        });

        // Add new files if uploaded
        if (req.files && req.files.length > 0) {
            const newFiles = req.files.map((file) => ({
                originalName: file.originalname,
                fileName: file.filename,
                filePath: file.path,
                fileType: file.mimetype,
                fileSize: file.size,
            }));
            caseInfo.files = [...caseInfo.files, ...newFiles];
        }

        await caseInfo.save();
        res.json(caseInfo);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete case info (admin only)
router.delete("/:id", auth, async (req, res) => {
    try {
        const caseInfo = await CaseInfo.findByIdAndDelete(req.params.id);
        if (!caseInfo) {
            return res.status(404).json({ error: "Case info not found" });
        }
        res.json({ message: "Case info deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete specific file from case (admin only)
router.delete("/:id/files/:fileIndex", auth, async (req, res) => {
    try {
        const caseInfo = await CaseInfo.findById(req.params.id);
        if (!caseInfo) {
            return res.status(404).json({ error: "Case info not found" });
        }

        const fileIndex = parseInt(req.params.fileIndex);
        if (fileIndex < 0 || fileIndex >= caseInfo.files.length) {
            return res.status(404).json({ error: "File not found" });
        }

        // Delete physical file
        const fileToDelete = caseInfo.files[fileIndex];
        if (fileToDelete && fileToDelete.filePath) {
            try {
                fs.unlinkSync(fileToDelete.filePath);
            } catch (err) {
                console.error("Error deleting file:", err);
            }
        }

        caseInfo.files.splice(fileIndex, 1);
        await caseInfo.save();
        res.json({ message: "File deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
