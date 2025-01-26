import mongoose from 'mongoose';
import Tenant from '../../models/hcm-tenants/tenant.js';

const sampleTenant = {
    tenantId: "673a2407a8c797b7f3190bf4",
    personalInfo: {
        firstName: "Abdi",
        middleInitial: "",
        lastName: "Fadumo",
        dateOfBirth: new Date("1980-01-01T00:00:00.000Z"),
        gender: "Male",
        ssn: "123-45-6789",
        address: {
            line1: "123 Main St",
            line2: "Apt 4B",
            city: "Anytown",
            state: "NY",
            zipCode: "12345"
        },
        contact: {
            homePhone: "(123) 432-3454",
            cellPhone: "(123) 432-3454",
            workPhone: "(123) 432-3454",
            email: "fadumo@gmail.com"
        }
    },
    emergencyContact: {
        firstName: "Jane",
        middleInitial: "B",
        lastName: "Doe",
        phoneNumber: "555-4321",
        email: "jane.doe@example.com",
        relationship: "Spouse"
    },
    responsibleParty: {
        firstName: "Jim",
        middleInitial: "C",
        lastName: "Beam",
        phoneNumber: "555-9876",
        email: "jim.beam@example.com",
        relationship: "Brother"
    },
    insurance: "Health Insurance Co.",
    services: [
        {
            serviceType: "Physical Therapy",
            startDate: new Date("2023-01-01T00:00:00.000Z"),
            endDate: new Date("2023-12-31T00:00:00.000Z"),
            totalDays: 365,
            totalUnits: 1000,
            unitsPerDay: 3,
            unitsPerWeek: 21
        }
    ],
    caregivers: [
        {
            caregiverName: "Alice Smith",
            serviceTypes: [
                {
                    serviceType: "Physical Therapy",
                    startDate: new Date("2023-01-01T00:00:00.000Z"),
                    endDate: new Date("2023-12-31T00:00:00.000Z"),
                    totalDays: 365,
                    totalUnits: 1000,
                    unitsPerDay: 3,
                    unitsPerWeek: 21
                }
            ]
        }
    ]
};

const insertSampleTenant = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/your_database_name', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        await Tenant.deleteMany({});
        await Tenant.create(sampleTenant);

        console.log('Sample tenant data inserted successfully.');
        mongoose.connection.close();
    } catch (error) {
        console.error('Error inserting sample tenant data:', error);
    }
};

insertSampleTenant();