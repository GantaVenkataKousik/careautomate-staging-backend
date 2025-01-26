import mongoose from 'mongoose';
import hcmvisits from '../../models/appointments-visits/visits.js'; // Import the visits model

const visitsData = [
    {
        visitDate: new Date('2024-09-20'),
        tenantId: 'tenant1_id',
        reason: 'Initial Consultation',
        hcm: 'Dr. Smith',
        notes: 'Discussed health history and created treatment plan.'
    },
    {
        visitDate: new Date('2024-09-22'),
        tenantId: 'tenant2_id',
        reason: 'Post-Surgery Follow-up',
        hcm: 'Dr. Brown',
        notes: 'Checked recovery progress and prescribed new medication.'
    },
    {
        visitDate: new Date('2024-10-05'),
        tenantId: 'tenant3_id',
        reason: 'Rehabilitation Session',
        hcm: 'Dr. Green',
        notes: 'Conducted therapy exercises, patient showed good improvement.'
    },
];

const insertHCMVisitsData = async () => {
    try {
        await hcmvisits.insertMany(visitsData);
        console.log("Visits data inserted successfully!");
    } catch (error) {
        console.error("Error inserting visits data:", error);
    }
};

export default insertHCMVisitsData;
