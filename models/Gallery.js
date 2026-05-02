const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        image: { type: String, default: "" },
    },
    { timestamps: true },
);

module.exports = mongoose.model("Gallery", gallerySchema);
