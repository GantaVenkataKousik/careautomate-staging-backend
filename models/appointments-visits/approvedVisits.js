import mongoose from 'mongoose';

// Define the schema for Visits
const approvedVisitsSchema = new mongoose.Schema(
    {
        visit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'visits',
            required: true
        },
        bill: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'bills'
        }, companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'company' }
    },
    {
        timestamps: true,
    }
);

// Create the model
export default mongoose.model('approvedvisits', approvedVisitsSchema);
