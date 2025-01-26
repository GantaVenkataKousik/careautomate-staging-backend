import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'users'
    },
    folderName: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true,
        default: () => new Date().getFullYear().toString()
    },
    reviewStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, { timestamps: true, strict: true });

export default mongoose.model('Document', documentSchema);

