import mongoose from 'mongoose';
// Define the schema for Visits
const visitsApprovedSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'causers',
        },
        hcmId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'causers',
        },
        creatorId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'causers',
        },
        serviceType: {
            type: String,
            required: true,
            trim: true,
        },
        visitId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'visits',
        },
        billId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'bills',
        }
    },
    {
        timestamps: true,
    }
);

// Create the model
export default mongoose.model('approvedVisits', visitsApprovedSchema); 