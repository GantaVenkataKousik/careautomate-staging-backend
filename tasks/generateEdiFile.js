import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import Bill from '../models/bills/bills.js';

const generateEdiFile = async (tenantId) => {
    try {
        const bill = await Bill.findOne({ tenantId });

        if (!bill) {
            console.error('No bill found for the given tenant ID');
            return;
        }

        const interchangeControlNumber = '111111299'; // Example control number, should be unique for each EDI
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().slice(0, 10).replace(/-/g, '');
        const formattedTime = currentDate.toTimeString().slice(0, 5).replace(':', '');

        // Use the first service line if available
        const serviceLine = bill.serviceLine[0];

        const ediContent = [
            `ISA*00*          *00*          *ZZ*${bill.interchangeControlHeader.senderId}     *30*${bill.interchangeControlHeader.receiverId}         *${formattedDate}*${formattedTime}*^*${bill.interchangeControlHeader.controlVersionNumber}*${interchangeControlNumber}*1*P*:~`,
            `GS*HC*${bill.functionalGroupHeader.senderCode}*${bill.functionalGroupHeader.receiverCode}*${formattedDate}*${formattedTime}*${interchangeControlNumber}*X*005010X222A1~`,
            `ST*837*0001*005010X222A1~`,
            `BHT*0019*00*${interchangeControlNumber}*${formattedDate}*${formattedTime}*CH~`,
            `NM1*41*2*${bill.submitterName.name}*****46*${bill.submitterName.identifier}~`,
            `PER*IC*${bill.submitterName.contactName || ''}*TE*${bill.submitterName.communicationNumber || ''}~`,
            `NM1*40*2*${bill.receiverName.name}*****46*${bill.receiverName.primaryIdentifier}~`,
            `HL*1**20*1~`,
            `PRV*BI*PXC*${bill.billingProvider.taxonomyCode || ''}~`,
            `NM1*85*2*${bill.billingProvider.name}*****XX*${bill.billingProvider.identifier}~`,
            `N3*${bill.billingProvider.address.line1 || ''}~`,
            `N4*${bill.billingProvider.address.city || ''}*${bill.billingProvider.address.state || ''}*${bill.billingProvider.address.zipCode || ''}~`,
            `REF*EI*${bill.billingProvider.additionalIdentifier || ''}~`,
            `HL*2*1*22*0~`,
            `SBR*P*18*******CI~`,
            `NM1*IL*1*${bill.subscriber.lastName}*${bill.subscriber.firstName}****MI*${bill.subscriber.primaryIdentifier}~`,
            `N3*${bill.subscriber.address.line1 || ''}~`,
            `N4*${bill.subscriber.address.city || ''}*${bill.subscriber.address.state || ''}*${bill.subscriber.address.zipCode || ''}~`,
            `DMG*D8*${bill.subscriber.gender || 'U'}~`,
            `NM1*PR*2*${bill.payerName.name}*****PI*${bill.payerName.identifier}~`,
            `REF*G2*${bill.payerName.secondaryIdentifier || ''}~`,
            `CLM*${bill.claimInformation.patientAccountNumber}*${bill.claimInformation.totalClaimChargeAmount}***11:B:1*N*A*Y*Y*P~`,
            `REF*EA*${bill.claimInformation.medicalRecordNumber || ''}~`,
            `HI*ABK:${bill.claimInformation.diagnosisCode}~`,
            `NM1*82*2*${bill.renderingProvider.name}*****XX*${bill.renderingProvider.identifier}~`,
            `REF*G2*${bill.renderingProvider.secondaryIdentifier || ''}~`,
            `LX*1~`,
            `SV1*HC:${serviceLine.procedureCode}:${serviceLine.modifier || ''}:::${serviceLine.description}*${serviceLine.lineItemChargeAmount}*UN*${serviceLine.serviceUnitCount}***1~`,
            `DTP*472*D8*${serviceLine.serviceDate.toISOString().slice(0, 10).replace(/-/g, '')}~`,
            `REF*6R*${serviceLine.lineItemControlNumber || ''}~`,
            `CLP*${bill.claimInformation.patientAccountNumber}*1*${bill.claimInformation.totalClaimChargeAmount}*${bill.claimInformation.totalClaimChargeAmount}**${bill.subscriber.primaryIdentifier}~`,
            `SE*29*0001~`,
            `GE*1*${interchangeControlNumber}~`,
            `IEA*1*${interchangeControlNumber}~`
        ].join('\n');

        // Ensure the ediFiles directory exists
        const ediFilesDir = path.join(__dirname, '../ediFiles');
        if (!fs.existsSync(ediFilesDir)) {
            fs.mkdirSync(ediFilesDir, { recursive: true });
        }

        // Construct the filename using NPI, TransactionID, and current date
        const npi = bill.billingProvider.identifier; // Assuming NPI is stored here
        const transactionId = interchangeControlNumber; // Using interchangeControlNumber as TransactionID
        const fileName = `${npi}_${transactionId}_${formattedDate}_TPinfo.dat`;

        const filePath = path.join(ediFilesDir, fileName);
        fs.writeFileSync(filePath, ediContent);

        console.log('EDI file generated successfully:', filePath);
    } catch (error) {
        console.error('Error generating EDI file:', error);
    }
};

export { generateEdiFile };
