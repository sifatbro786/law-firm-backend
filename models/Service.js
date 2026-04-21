const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
        },
        description: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
            default: "",
        },
        icon: String,
        order: {
            type: Number,
            default: 0,
            index: true  // For faster sorting
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model("Service", serviceSchema);