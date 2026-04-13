const mongoose = require("mongoose");

const attorneySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        image: String,
        bio: {
            type: String,
            required: true,
        },
        specialization: [String],
        experience: Number,
        email: String,
        phone: String,
        education: [String],
        barCertification: String,
    },
    { timestamps: true },
);

module.exports = mongoose.model("Attorney", attorneySchema);
