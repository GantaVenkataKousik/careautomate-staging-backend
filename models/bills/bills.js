import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'causers'
  },
  serviceType: {
    type: String,
  },
  interchangeControlHeader: {
    senderId: { type: String, required: true },
    receiverId: { type: String, default: '000000' },
    date: { type: Date, default: Date.now },
    time: { type: String },
    controlVersionNumber: { type: String, default: '00501' },
    controlNumber: { type: String }
  },
  functionalGroupHeader: {
    senderCode: { type: String, required: true },
    receiverCode: { type: String, default: '000000' },
    date: { type: Date, default: Date.now },
    time: { type: String },
    groupControlNumber: { type: String }
  },
  transactionSetHeader: {
    identifierCode: { type: String, default: '837' },
    controlNumber: { type: String, default: '0001' },
    conventionReference: { type: String }
  },
  hierarchicalTransaction: {
    structureCode: { type: String, default: '0019' },
    purposeCode: { type: String, default: '00' },
    originalTransactionId: { type: String },
    creationDate: { type: Date, default: Date.now },
    transactionTypeCode: { type: String, default: 'CH' }
  },
  submitterName: {
    name: { type: String, required: true },
    identifier: { type: String, required: true },
    contactName: { type: String },
    communicationNumber: { type: String }
  },
  receiverName: {
    name: { type: String, default: 'Waystar' },
    primaryIdentifier: { type: String, default: '000000' }
  },
  billingProvider: {
    taxonomyCode: { type: String },
    name: { type: String, required: true },
    identifier: { type: String, required: true },
    address: {
      line1: { type: String },
      line2: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String }
    },
    additionalIdentifier: { type: String }
  },
  subscriber: {
    lastName: { type: String },
    firstName: { type: String },
    identificationCodeQualifier: { type: String, default: 'MI' },
    primaryIdentifier: { type: String },
    address: {
      line1: { type: String },
      line2: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String }
    },
    gender: { type: String }
  },
  payerName: {
    name: { type: String },
    identifier: { type: String },
    secondaryIdentifier: { type: String }
  },
  claimInformation: {
    patientAccountNumber: { type: String },
    totalClaimChargeAmount: { type: Number },
    medicalRecordNumber: { type: String },
    diagnosisCode: { type: String }
  },
  renderingProvider: {
    name: { type: String },
    identifier: { type: String, default: 'ATYPICAL' },
    secondaryIdentifier: { type: String }
  },
  serviceLine: [{
    procedureCode: { type: String },
    modifier: { type: String },
    description: { type: String, default: 'Housing Stabilization Services' },
    lineItemChargeAmount: { type: Number },
    serviceUnitCount: { type: Number },
    diagnosisCodePointer: { type: String, default: '1' },
    serviceDate: { type: Date },
    lineItemControlNumber: { type: String }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  visit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'approvedvisits'
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'company'
  }
});


export default mongoose.model('Bill', billSchema);