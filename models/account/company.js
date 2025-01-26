import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'causers',
        required: true
    },
    companyName: {
        type: String,
        required: true
    },
    adminName: {
        type: String,
        required: true
    },
    adminEmail: {
        type: String,
        required: true
    }
});

export default mongoose.model('company', companySchema);