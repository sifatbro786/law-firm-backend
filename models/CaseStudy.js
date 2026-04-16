const mongoose = require("mongoose");

const caseStudySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        category: {
            type: String,
            required: true,
            enum: [
                "Corporate Law",
                "Property Law",
                "International Law",
                "Family Law",
                "Criminal Law",
                "Other",
            ],
        },
        client: {
            type: String,
            required: true,
        },
        problem: {
            type: String,
            required: true,
        },
        solution: {
            type: String,
            required: true,
        },
        result: {
            type: String,
            required: true,
        },
        outcome: {
            type: String,
            required: true,
        },
        image: String,
        isPublished: {
            type: Boolean,
            default: true,
        },
        order: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model("CaseStudy", caseStudySchema);
