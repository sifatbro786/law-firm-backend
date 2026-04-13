const express = require("express");
const Blog = require("../models/Blog");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const router = express.Router();

// Get all blogs
router.get("/", async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const blogs = await Blog.find()
            .sort("-createdAt")
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Blog.countDocuments();

        res.json({
            blogs,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single blog by slug
router.get("/:slug", async (req, res) => {
    try {
        const blog = await Blog.findOne({ slug: req.params.slug });
        if (!blog) {
            return res.status(404).json({ error: "Blog not found" });
        }
        // Increment views
        blog.views += 1;
        await blog.save();
        res.json(blog);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create blog (admin only)
router.post("/", auth, upload.single("image"), async (req, res) => {
    try {
        const blogData = JSON.parse(req.body.data);
        if (req.file) {
            blogData.image = `/uploads/${req.file.filename}`;
        }
        const blog = new Blog(blogData);
        await blog.save();
        res.status(201).json(blog);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update blog (admin only)
router.put("/:id", auth, upload.single("image"), async (req, res) => {
    try {
        const blogData = JSON.parse(req.body.data);
        if (req.file) {
            blogData.image = `/uploads/${req.file.filename}`;
        }
        const blog = await Blog.findByIdAndUpdate(req.params.id, blogData, {
            new: true,
            runValidators: true,
        });
        if (!blog) {
            return res.status(404).json({ error: "Blog not found" });
        }
        res.json(blog);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete blog (admin only)
router.delete("/:id", auth, async (req, res) => {
    try {
        const blog = await Blog.findByIdAndDelete(req.params.id);
        if (!blog) {
            return res.status(404).json({ error: "Blog not found" });
        }
        res.json({ message: "Blog deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
