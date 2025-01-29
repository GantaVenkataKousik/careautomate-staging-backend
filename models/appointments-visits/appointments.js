import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    hcmId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'causers',
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'causers',
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    activity: {
      type: String,
    },
    methodOfContact: {
      type: String,
      enum: ['in-person', 'remote'],
    },
    reasonForRemote: {
      type: String,
      required: function () {
        return this.methodOfContact === 'remote';
      },
    },
    placeOfService: {
      type: String,
    },
    serviceType: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'company' },
  },
  { timestamps: true }
);

export default mongoose.model('appointments', appointmentSchema);
