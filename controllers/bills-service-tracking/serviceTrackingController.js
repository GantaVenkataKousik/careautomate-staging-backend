import ServiceTracking from '../../models/bills/serviceTracking.js';
import users from '../../models/account/users.js';
import hcmInfo from '../../models/hcm-tenants/hcmInfo.js';

export const getUnitsRemaining = async (req, res) => {
    try {
        const { hcmId, tenantId, serviceType } = req.query;

        if (!hcmId || !tenantId || !serviceType) {
            return res.status(400).json({
                success: false,
                message: 'hcmId, tenantId, and serviceType are required'
            });
        }

        const serviceTracking = await ServiceTracking.findOne({ hcmId, tenantId, serviceType });

        if (!serviceTracking) {
            return res.status(404).json({
                success: false,
                message: 'Service tracking information not found'
            });
        }

        const costPerUnit = 17.7;
        const totalCost = serviceTracking.unitsRemaining * costPerUnit;

        res.status(200).json({
            success: true,
            message: "Units remaining fetched successfully",
            response: {
                unitsRemaining: serviceTracking.unitsRemaining,
                totalCost: totalCost.toFixed(2) // Format to 2 decimal places
            }
        });
    } catch (error) {
        console.error('Error fetching units remaining:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export const getHcmUnitsStats = async (req, res) => {
    try {
        const { tenantId } = req.body;
        const currentYear = new Date().getFullYear();
        const startYear = 2023;
        const serviceTypes = ['Housing Transition', 'Housing Sustaining'];
        const response = {};

        for (const serviceType of serviceTypes) {
            response[serviceType] = {};

            for (let year = startYear; year <= currentYear; year++) {
                const serviceTracking = await ServiceTracking.findOne({ tenantId, serviceType, year });

                if (!serviceTracking) {
                    response[serviceType][year] = {
                        message: 'Service tracking data not found'
                    };
                } else {
                    const allottedUnits = 600; // Assuming 600 units are allotted for 150 hours
                    const workedUnits = allottedUnits - serviceTracking.unitsRemaining;
                    const remainingUnits = serviceTracking.unitsRemaining;
                    const scheduledUnits = serviceTracking.scheduledUnits || 0; // Use actual scheduled units if available
                    const scheduledHours = scheduledUnits / 4; // Convert units to hours

                    response[serviceType][year] = {
                        allottedUnits,
                        allottedHours: allottedUnits / 4,
                        workedUnits,
                        workedHours: workedUnits / 4,
                        remainingUnits,
                        remainingHours: remainingUnits / 4,
                        scheduledUnits,
                        scheduledHours
                    };
                }
            }
        }

        res.status(200).json({ success: true, message: "HCM units stats fetched successfully", response: response });
    } catch (error) {
        console.error('Error fetching HCM units stats:', error);
        res.status(500).send('Internal Server Error');
    }
};

export const planUsage = async (req, res) => {
    try {
        const { tenantId } = req.body;

        // Fetch all service tracking records for the given tenant ID
        const serviceTrackings = await ServiceTracking.find({ tenantId, companyId });

        if (serviceTrackings.length === 0) {
            return res.status(400).json({ success: false, message: "Service tracking data not found for the given tenant ID" });
        }

        const response = await Promise.all(serviceTrackings.map(async (serviceTracking) => {
            const hcmDetails = await Promise.all(serviceTracking.hcmIds.map(async (hcmEntry) => {
                const user = await users.findById(hcmEntry.hcmId);
                if (!user) return null;

                const hcmInfoRecord = await hcmInfo.findById(user.info_id);
                return {
                    hcmId: hcmEntry.hcmId,
                    workedHours: hcmEntry.workedHours,
                    workedUnits: hcmEntry.workedUnits,
                    hcmInfo: hcmInfoRecord
                };
            }));

            return {
                serviceType: serviceTracking.serviceType,
                period: `${serviceTracking.startDate.toISOString().split('T')[0]} to ${serviceTracking.endDate.toISOString().split('T')[0]}`,
                totalUnits: serviceTracking.totalUnits,
                unitsRemaining: serviceTracking.unitsRemaining,
                scheduledUnits: serviceTracking.scheduledUnits,
                workedUnits: serviceTracking.workedUnits,
                workedHours: serviceTracking.workedHours,
                hcmDetails: hcmDetails.filter(detail => detail !== null) // Filter out any null entries
            };
        }));

        return res.status(200).json({ success: true, message: "Plan usage fetched successfully", response });
    } catch (error) {
        console.error(error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getAllServicesByTenant = async (req, res) => {
    try {
        const { tenantId } = req.body;
        const services = await ServiceTracking.find({ tenantId });
        return res.status(200).json({ success: true, message: "Services fetched successfully", response: services });
    } catch (error) {
        console.error(error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getAllServices = async (req, res) => {
    const { companyId } = req.params;
    try {
        const services = await ServiceTracking.find({ companyId });

        return res.status(200).json({ success: true, message: "Services fetched successfully", response: services });
    } catch (error) {
        console.error(error);
        return res.status(400).json({ success: false, message: error.message });
    }
};
