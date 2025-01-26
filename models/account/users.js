import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    info_id: {
        type: String,
    },
    phoneNo: {
        type: String,
    },
    state: {
        type: String,
    },
    city: {
        type: String,
    },
    accountSetup: {
        type: Boolean,
        default: false
    },
    role: {
        type: Number,
        default: 0
    },
    passwordChangedAt: {
        type: Date,
        default: null
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'company'
    },
    companyName: {
        type: String,
    },
    dateCreated: {
        type: Date,
        default: Date.now()
    }
});
export default mongoose.model('causers', userSchema);