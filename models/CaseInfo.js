const mongoose = require("mongoose");

const caseInfoSchema = new mongoose.Schema(
    {
        caseNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        district: {
            type: String,
            required: true,
            trim: true,
        },
        clientName: {
            type: String,
            required: true,
            trim: true,
        },
        clientAddress: {
            type: String,
            required: true,
            trim: true,
        },
        clientMobileNo: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        isReferenced: {
            type: Boolean,
            default: false,
        },
        referenceName: {
            type: String,
            trim: true,
        },
        referenceMobileNo: {
            type: String,
            trim: true,
        },
        files: [
            {
                originalName: String,
                fileName: String,
                filePath: String,
                fileType: String,
                fileSize: Number,
                uploadedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    { timestamps: true },
);

caseInfoSchema.pre("save", function (next) {
    if (this.isReferenced && (!this.referenceName || !this.referenceMobileNo)) {
        return next(
            new Error("Reference name and mobile number are required when isReferenced is true"),
        );
    }
    next();
});

// Create index for search functionality
caseInfoSchema.index({
    caseNumber: "text",
    clientName: "text",
    clientMobileNo: "text",
    referenceName: "text",
    referenceMobileNo: "text",
});

module.exports = mongoose.model("CaseInfo", caseInfoSchema);
