const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
    {
        brandName: { type: String, required: true },
        brandImage: { type: String, default: "" },
    },
    { timestamps: true },
);

module.exports = mongoose.model("Client", clientSchema);
