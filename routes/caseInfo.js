const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const CaseInfo = require("../models/CaseInfo");
const auth = require("../middleware/auth");

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../uploads/cases");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("Created uploads directory:", uploadDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext).replace(/\s+/g, "-");
        cb(null, "case-" + baseName + "-" + uniqueSuffix + ext);
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

// Create new case info with file upload (admin only) - FIXED
router.post("/", auth, upload.array("files", 10), async (req, res) => {
    try {
        console.log("=== CREATE CASE INFO ===");
        console.log("Files received:", req.files ? req.files.length : 0);

        const fileData =
            req.files?.map((file) => ({
                originalName: file.originalname,
                fileName: file.filename,
                // শুধু relative path সংরক্ষণ করুন, full path না
                filePath: `/uploads/cases/${file.filename}`, // IMPORTANT: শুধু relative path
                fileType: file.mimetype,
                fileSize: file.size,
                uploadedAt: new Date(),
            })) || [];

        const caseInfoData = {
            caseNumber: req.body.caseNumber,
            district: req.body.district,
            clientName: req.body.clientName,
            clientAddress: req.body.clientAddress,
            clientMobileNo: req.body.clientMobileNo,
            description: req.body.description,
            isReferenced: req.body.isReferenced === "true" || req.body.isReferenced === true,
            referenceName: req.body.referenceName || "",
            referenceMobileNo: req.body.referenceMobileNo || "",
            files: fileData,
        };

        const caseInfo = new CaseInfo(caseInfoData);
        await caseInfo.save();

        res.status(201).json(caseInfo);
    } catch (error) {
        console.error("Create case info error:", error);
        res.status(400).json({ error: error.message });
    }
});

// Update case info with optional file upload (admin only) - FIXED
router.put("/:id", auth, upload.array("files", 10), async (req, res) => {
    try {
        console.log("=== UPDATE CASE INFO ===");
        console.log("ID:", req.params.id);

        const caseInfo = await CaseInfo.findById(req.params.id);
        if (!caseInfo) {
            return res.status(404).json({ error: "Case info not found" });
        }

        // Update basic fields
        caseInfo.caseNumber = req.body.caseNumber || caseInfo.caseNumber;
        caseInfo.district = req.body.district || caseInfo.district;
        caseInfo.clientName = req.body.clientName || caseInfo.clientName;
        caseInfo.clientAddress = req.body.clientAddress || caseInfo.clientAddress;
        caseInfo.clientMobileNo = req.body.clientMobileNo || caseInfo.clientMobileNo;
        caseInfo.description = req.body.description || caseInfo.description;
        caseInfo.isReferenced = req.body.isReferenced === "true" || req.body.isReferenced === true;
        caseInfo.referenceName = req.body.referenceName || "";
        caseInfo.referenceMobileNo = req.body.referenceMobileNo || "";

        // Handle file deletions
        if (req.body.removeFiles) {
            const filesToRemove = JSON.parse(req.body.removeFiles);
            const sortedIndices = [...filesToRemove].sort((a, b) => b - a);
            for (const fileIndex of sortedIndices) {
                if (caseInfo.files[fileIndex]) {
                    const fileToDelete = caseInfo.files[fileIndex];
                    // Delete physical file
                    const physicalPath = path.join(__dirname, "..", fileToDelete.filePath);
                    if (fs.existsSync(physicalPath)) {
                        fs.unlinkSync(physicalPath);
                        console.log("Deleted file:", physicalPath);
                    }
                    caseInfo.files.splice(fileIndex, 1);
                }
            }
        }

        // Add new files - শুধু relative path সংরক্ষণ করুন
        if (req.files && req.files.length > 0) {
            const newFiles = req.files.map((file) => ({
                originalName: file.originalname,
                fileName: file.filename,
                filePath: `/uploads/cases/${file.filename}`, // IMPORTANT: শুধু relative path
                fileType: file.mimetype,
                fileSize: file.size,
                uploadedAt: new Date(),
            }));
            caseInfo.files = [...caseInfo.files, ...newFiles];
        }

        await caseInfo.save();
        res.json(caseInfo);
    } catch (error) {
        console.error("Update case info error:", error);
        res.status(400).json({ error: error.message });
    }
});

// Delete case info (admin only)
router.delete("/:id", auth, async (req, res) => {
    try {
        const caseInfo = await CaseInfo.findById(req.params.id);
        if (!caseInfo) {
            return res.status(404).json({ error: "Case info not found" });
        }

        // Delete all associated files
        for (const file of caseInfo.files) {
            if (file.filePath && fs.existsSync(file.filePath)) {
                fs.unlinkSync(file.filePath);
                console.log("Deleted file:", file.filePath);
            }
        }

        await CaseInfo.findByIdAndDelete(req.params.id);
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

        // Delete physical file using relative path
        const fileToDelete = caseInfo.files[fileIndex];
        if (fileToDelete && fileToDelete.filePath) {
            const physicalPath = path.join(__dirname, "..", fileToDelete.filePath);
            if (fs.existsSync(physicalPath)) {
                fs.unlinkSync(physicalPath);
                console.log("Deleted file:", physicalPath);
            }
        }

        caseInfo.files.splice(fileIndex, 1);
        await caseInfo.save();

        res.json({
            message: "File deleted successfully",
            files: caseInfo.files,
        });
    } catch (error) {
        console.error("Delete file error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
