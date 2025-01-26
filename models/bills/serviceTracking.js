// models/bills/serviceTracking.js

import mongoose from 'mongoose';

const hcmServiceDetailSchema = new mongoose.Schema({
    dateOfService: {
        type: Date,
        required: true
    },
    scheduledUnits: {
        type: Number,
        default: 0
    },
    workedUnits: {
        type: Number,
        default: 0
    },
    methodOfContact: {
        type: String,
    },
    placeOfService: {
        type: String,
    }
});

const hcmSchema = new mongoose.Schema({
    hcmId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'causers'
    },
    workedHours: {
        type: Number,
        default: 0
    },
    workedUnits: {
        type: Number,
        default: 0
    },
    serviceDetails: [hcmServiceDetailSchema] // Array of service details for each HCM
});

const serviceTrackingSchema = new mongoose.Schema({
    hcmIds: [{
        type: hcmSchema,
        default: []
    }],
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'causers',
        required: true
    },
    serviceType: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    unitsRemaining: {
        type: Number,
        default: 0
    },
    totalUnits: {
        type: Number,
        default: 0
    },
    billRate: {
        type: Number,
        default: 0
    },
    scheduledUnits: {
        type: Number,
        default: 0
    },
    workedUnits: {
        type: Number,
        default: 0
    },
    workedHours: {
        type: Number,
        default: 0
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'company'
    }
});

export default mongoose.model('ServiceTracking', serviceTrackingSchema);