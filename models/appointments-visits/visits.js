import mongoose from 'mongoose';
// Define the schema for Visits
const visitsSchema = new mongoose.Schema(
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
        activity: {
            type: String,
            trim: true,
        },
        date: {
            type: Date,
            required: true,
        },
        startTime: {
            type: Date, // Changed from String to Date
            required: true
        },
        endTime: {
            type: Date, // Changed from String to Date
            required: true
        },
        place: {
            type: String,
            trim: true,
        },
        methodOfContact: {
            type: String,
            enum: ['in-person', 'remote'],
        },
        reasonForRemote: {
            type: String,
            trim: true,
            default: null,
        },
        notes: {
            type: String,
            trim: true,
        },
        travel: {
            type: String,
            enum: ['yes', 'no'],
        },
        totalMiles: {
            type: Number,
            default: 0,
        },
        travelWithTenant: {
            type: String,
            trim: true,
            default: null,
        },
        travelWithoutTenant: {
            type: String,
            trim: true,
            default: null,
        },
        signature: {
            type: String,
            enum: ['done', 'not done'],
            default: 'not done',
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        response: {
            type: String,
        },
        billId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'bills',
        },
        reasonForRejection: {
            type: String,
            trim: true,
        },
        timeOfRejection: {
            type: Date,
            default: null,
        },
        timeOfApproval: {
            type: Date,
            default: null,
        }, companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'company' }
    },
    {
        timestamps: true,
    }
);

// Create the model
export default mongoose.model('visits', visitsSchema);

export const visitCompilance = async (req, res) => {
    try {
        const visits = await Visits.find({})
            .populate({
                path: 'tenantId',
                select: '_id name email',
                model: 'causers'
            })
            .populate({
                path: 'hcmId',
                select: '_id name email',
                model: 'causers'
            });

        const visitCounts = {};
        const visitDetails = {
            inPerson: [],
            direct: [],
            indirect: [],
            remote: [],
            unknown: []
        };

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        visits.forEach(visit => {
            const visitDate = new Date(visit.date);
            if (isNaN(visitDate)) {
                console.error(`Invalid date for visit ID: ${visit._id}`);
                return;
            }

            const year = visitDate.getFullYear();
            const month = monthNames[visitDate.getMonth()];

            if (!visitCounts[year]) {
                visitCounts[year] = {};
            }
            if (!visitCounts[year][month]) {
                visitCounts[year][month] = { direct: 0, indirect: 0, remote: 0, inPerson: 0 };
            }

            let method = visit.methodOfContact || 'unknown';
            switch (method) {
                case 'in-person':
                    visitCounts[year][month].inPerson++;
                    visitDetails.inPerson.push(createVisitDetail(visit));
                    break;
                case 'direct':
                    visitCounts[year][month].direct++;
                    visitDetails.direct.push(createVisitDetail(visit));
                    break;
                case 'indirect':
                    visitCounts[year][month].indirect++;
                    visitDetails.indirect.push(createVisitDetail(visit));
                    break;
                case 'remote':
                    visitCounts[year][month].remote++;
                    visitDetails.remote.push(createVisitDetail(visit));
                    break;
                default:
                    console.warn(`Unknown methodOfContact for visit ID: ${visit._id}`);
                    visitDetails.unknown.push(createVisitDetail(visit));
                    break;
            }
        });

        res.status(200).json({
            success: true,
            message: "Visit compliance fetched successfully",
            response: {
                visitCounts,
                visitDetails,
                totalVisits: visits.length
            }
        });
    } catch (error) {
        console.error("Error fetching visit data:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching visit compliance data."
        });
    }
};

function createVisitDetail(visit) {
    return {
        visitId: visit._id,
        tenant: {
            tenantId: visit.tenantId ? visit.tenantId._id : 'Unknown Tenant ID',
            tenantName: visit.tenantId ? visit.tenantId.name : 'Unknown Tenant',
            tenantEmail: visit.tenantId ? visit.tenantId.email : 'Unknown Email'
        },
        hcm: {
            hcmId: visit.hcmId ? visit.hcmId._id : 'Unknown HCM ID',
            hcmName: visit.hcmId ? visit.hcmId.name : 'Unknown HCM',
            hcmEmail: visit.hcmId ? visit.hcmId.email : 'Unknown Email'
        },
        serviceType: visit.serviceType,
        dateOfService: visit.date.toISOString().split('T')[0],
        methodOfVisit: visit.methodOfContact || 'N/A'
    };
}