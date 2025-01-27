import appointments from "../../models/appointments-visits/appointments.js";
import mongoose from 'mongoose';
import ServiceTracking from "../../models/bills/serviceTracking.js";
import Visits from "../../models/appointments-visits/visits.js";
import { response } from "express";

export const filterAppointments = async (req, res) => {
    try {
        const { hcmId, tenantId, status, approved, startDate, endDate, companyId } = req.body;

        // Build query with validation
        const query = { companyId };

        // Add hcmId to query if provided and valid
        if (hcmId) {
            if (!mongoose.Types.ObjectId.isValid(hcmId)) {
                return res.status(200).json({
                    success: false,
                    message: 'Invalid HCM ID format'
                });
            }
            query.hcmId = hcmId;
        }

        // Add tenantId to query if provided and valid
        if (tenantId) {
            if (!mongoose.Types.ObjectId.isValid(tenantId)) {
                return res.status(200).json({
                    success: false,
                    message: 'Invalid Tenant ID format'
                });
            }
            query.tenantId = tenantId;
        }

        // Add status to query if provided and valid
        if (status) {
            const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(200).json({
                    success: false,
                    message: 'Invalid status value'
                });
            }
            query.status = status;
        }

        // Add approved to query if provided
        if (approved !== undefined) {
            query.approved = approved;
        }

        // Add date range to query if provided
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(200).json({
                    success: false,
                    message: 'Invalid date format'
                });
            }
            query.date = { $gte: start, $lte: end };
        }

        const appointments = await appointments.find(query)
            .populate({
                path: 'hcmId',
                select: 'name email phoneNo',
                model: 'users'
            })
            .populate({
                path: 'tenantId',
                select: 'name email phoneNo',
                model: 'users'
            })
            .sort({ date: 1, startTime: 1 });

        if (appointments.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No appointments found with the specified criteria.',
                appointments: {
                    completed: {},
                    upcoming: {},
                    cancelled: {}
                }
            });
        }

        // Group appointments by status, year, month, and date
        const groupedAppointments = {
            completed: {},
            upcoming: {},
            cancelled: {}
        };

        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        appointments.forEach(appointment => {
            const appDate = new Date(appointment.date);
            appDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
            const year = appDate.getFullYear().toString();
            const month = months[appDate.getMonth()];
            const date = appDate.getDate().toString().padStart(2, '0');

            const formattedAppointment = {
                ...appointment.toObject(),
                hcmDetails: appointment.hcmId,
                tenantDetails: appointment.tenantId
            };

            // Determine status group
            let statusGroup;
            if (appointment.status === 'completed') {
                statusGroup = 'completed';
            } else if (appointment.status === 'cancelled') {
                statusGroup = 'cancelled';
            } else {
                statusGroup = appDate >= currentDate ? 'upcoming' : 'completed';
            }

            // Initialize nested objects if they don't exist
            if (!groupedAppointments[statusGroup][year]) {
                groupedAppointments[statusGroup][year] = {};
            }
            if (!groupedAppointments[statusGroup][year][month]) {
                groupedAppointments[statusGroup][year][month] = {};
            }
            if (!groupedAppointments[statusGroup][year][month][date]) {
                groupedAppointments[statusGroup][year][month][date] = [];
            }

            groupedAppointments[statusGroup][year][month][date].push(formattedAppointment);
        });

        // Sort years, months, and dates
        for (const status in groupedAppointments) {
            const sortedYears = {};
            Object.keys(groupedAppointments[status])
                .sort((a, b) => b - a) // Sort years in descending order
                .forEach(year => {
                    sortedYears[year] = {};
                    const monthsInYear = groupedAppointments[status][year];

                    months.forEach(month => {
                        if (monthsInYear[month]) {
                            sortedYears[year][month] = {};
                            const datesInMonth = monthsInYear[month];

                            Object.keys(datesInMonth)
                                .sort((a, b) => a - b) // Sort dates in ascending order
                                .forEach(date => {
                                    sortedYears[year][month][date] = datesInMonth[date];
                                });
                        }
                    });
                });
            groupedAppointments[status] = sortedYears;
        }

        res.status(200).json({
            success: true,
            message: "Appointments fetched and grouped successfully",
            appointments: groupedAppointments
        });

    } catch (error) {
        console.error('Error in filterAppointments:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export const getAppointments = async (req, res) => {
    const { companyId } = req.params;
    try {
        // Convert companyId to ObjectId using 'new'
        const companyIdObject = new mongoose.Types.ObjectId(companyId);

        const appointmentsRecords = await appointments.find({ companyId: companyIdObject }).populate({
            path: 'hcmId',
            select: 'name email phoneNo',
            model: 'causers'
        })
            .populate({
                path: 'tenantId',
                select: 'name email phoneNo',
                model: 'causers'
            })
            .sort({ date: 1, startTime: 1 });

        const formattedAppointments = appointmentsRecords.map(app => ({
            ...app.toObject(),
            hcmDetails: app.hcmId,
            tenantDetails: app.tenantId
        }));

        res.status(200).json({
            success: true,
            message: "Appointments fetched successfully",
            response: {
                appointments: formattedAppointments
            }
        });
    }
    catch (error) {
        // console.error('Error in getAppointments:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export const fetchAppointments = async (req, res) => {
    const { companyId } = req.params;
    try {
        const appointments = await appointments.find({ companyId })
            .populate({
                path: 'hcmId',
                select: 'name email phoneNo',
                model: 'users'
            })
            .populate({
                path: 'tenantId',
                select: 'name email phoneNo',
                model: 'users'
            })
            .sort({ date: 1, startTime: 1 });

        if (appointments.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No appointments found.',
                appointments: {
                    completed: [],
                    pending: [],
                    other: []
                }
            });
        }

        // Group appointments by status
        const groupedAppointments = {
            completed: [],
            pending: [],
            other: []
        };

        appointments.forEach(appointment => {
            const formattedAppointment = {
                ...appointment.toObject(),
                hcmDetails: appointment.hcmId,
                tenantDetails: appointment.tenantId
            };

            // Determine status group
            if (appointment.status === 'completed') {
                groupedAppointments.completed.push(formattedAppointment);
            } else if (appointment.status === 'pending') {
                groupedAppointments.pending.push(formattedAppointment);
            } else {
                groupedAppointments.other.push(formattedAppointment);
            }
        });

        res.status(200).json({
            success: true,
            message: "Appointments fetched and grouped successfully",
            response: groupedAppointments
        });

    } catch (error) {
        console.error('Error in fetchAppointments:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export const updateAppointment = async (req, res) => {
    const { id } = req.params;
    const { updatedAppointmentData } = req.body;
    console.log(updatedAppointmentData);
    const appointmentId = new mongoose.Types.ObjectId(id);
    console.log(appointmentId);
    try {
        const appointment = await appointments.findById(appointmentId);
        const updatedAppointment = {
            tenantId: new mongoose.Types.ObjectId(updatedAppointmentData?.tenantId) || new mongoose.Types.ObjectId(appointment?.tenantId),
            hcmId: new mongoose.Types.ObjectId(updatedAppointmentData?.hcmId) || new mongoose.Types.ObjectId(appointment?.hcmId),
            date: updatedAppointmentData?.date || appointment?.date,
            startTime: updatedAppointmentData?.startTime || appointment?.startTime,
            endTime: updatedAppointmentData?.endTime || appointment?.endTime,
            serviceType: updatedAppointmentData?.serviceType || appointment?.serviceType,
            methodOfContact: updatedAppointmentData?.methodOfContact || appointment?.methodOfContact,
            reasonForRemote: updatedAppointmentData?.reasonForRemote || appointment?.reasonForRemote,
            placeOfService: updatedAppointmentData?.placeOfService || appointment?.placeOfService,
            travel: updatedAppointmentData?.travel || appointment?.travel,
            totalMiles: updatedAppointmentData?.totalMiles || appointment?.totalMiles,
            travelWithTenant: updatedAppointmentData?.travelWithTenant || appointment?.travelWithTenant,
            travelWithoutTenant: updatedAppointmentData?.travelWithoutTenant || appointment?.travelWithoutTenant,
            status: updatedAppointmentData?.status || appointment?.status
        }

        const updatedAppointmentRecord = await appointments.findByIdAndUpdate(appointmentId, updatedAppointment, { new: true });

        if (!updatedAppointment) {
            return res.status(204).json({ success: false, message: 'Appointment not found' });
        }

        res.status(200).json({ success: true, message: 'Appointment updated successfully', response: { updatedAppointment: updatedAppointmentRecord } });
    } catch (error) {
        console.error('Error in updateAppointment:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteAppointment = async (req, res) => {
    const { id } = req.params;
    console.log(id);

    try {
        const deletedAppointment = await appointments.findByIdAndDelete(id);

        if (!deletedAppointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        // Delete the associated visit record
        const deletedVisit = await Visits.findOneAndDelete({
            tenantId: deletedAppointment.tenantId,
            serviceType: deletedAppointment.serviceType
        });

        if (!deletedVisit) {
            console.log('No associated visit record found.');
        }

        res.status(200).json({ success: true, message: 'Appointment and associated visit deleted successfully' });
    } catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const createAppointment = async (req, res) => {
    try {
        const appointmentData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const {
            appointment,
            companyId
        } = appointmentData;

        // Validate required fields
        if (!appointment.tenantId || !appointment.hcmId || !appointment.date || !appointment.startTime || !appointment.endTime ||
            !appointment.serviceType) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        // Validate methodOfContact and reasonForRemote
        if (appointment.methodOfContact === 'remote' && !appointment.reasonForRemote) {
            return res.status(400).json({
                success: false,
                message: "Reason for remote contact is required when method is remote"
            });
        }
        const newAppointment = new appointments({
            ...appointment,
            companyId
        });
        console.log(newAppointment);
        const savedAppointment = await newAppointment.save();

        // Populate user details
        const populatedAppointment = await appointments.findById(savedAppointment._id)
            .populate({
                path: 'hcmId',
                select: 'name email phoneNo',
                model: 'causers'
            })
            .populate({
                path: 'tenantId',
                select: 'name email phoneNo',
                model: 'causers'
            });

        // Parse startTime and endTime as Date objects
        const appointmentStartTime = new Date(appointment.startTime);
        const appointmentEndTime = new Date(appointment.endTime);

        // Ensure startTime is before endTime
        if (appointmentStartTime >= appointmentEndTime) {
            return res.status(400).json({
                success: false,
                message: 'Start time must be before end time.',
                response: null
            });
        }

        //SERVICE TRACKING
        const durationInHours = (appointmentEndTime - appointmentStartTime) / (1000 * 60 * 60);

        // Convert hours to units (150 hours = 600 units, so 1 hour = 4 units)
        let unitsToAdd = durationInHours * 4;
        unitsToAdd = parseFloat(unitsToAdd.toFixed(2)); // Round to two decimal places
        let serviceTrackingInfo;
        // Find the service tracking record
        let serviceTracking = await ServiceTracking.findOne({ tenantId: appointment.tenantId, serviceType: appointment.serviceType });
        if (!serviceTracking) {
            // Create a new service tracking record with default values
            const startDate = new Date();
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1); // Set end date to one year from now

            serviceTracking = new ServiceTracking({
                tenantId: appointment.tenantId,
                serviceType: appointment.serviceType,
                startDate,
                endDate,
                unitsRemaining: 600 - unitsToAdd,
                totalUnits: 600,
                billRate: 17.17,
                scheduledUnits: unitsToAdd,
                hcmIds: [{
                    hcmId: appointment.hcmId,
                    serviceDetails: [{
                        dateOfService: appointment.date,
                        scheduledUnits: unitsToAdd,
                        workedUnits: 0,
                        methodOfContact: appointment.methodOfContact,
                        placeOfService: appointment.placeOfService
                    }]
                }],
                companyId
            });

            serviceTrackingInfo = await serviceTracking.save();
        } else {
            // Check if there are enough units available
            if (unitsToAdd > serviceTracking.unitsRemaining) {
                return res.status(400).json({
                    success: false,
                    message: 'Not enough units available to schedule this appointment.',
                    response: serviceTracking
                });
            }

            // Update scheduledUnits
            serviceTracking.scheduledUnits += unitsToAdd;
            serviceTracking.unitsRemaining -= unitsToAdd;

            // Find the HCM entry
            const hcmEntry = serviceTracking.hcmIds.find(hcm => hcm.hcmId && hcm.hcmId.toString() === appointment.hcmId);

            if (hcmEntry) {
                // Find the service detail for the specific date
                const serviceDetail = hcmEntry.serviceDetails.find(service => service.dateOfService === appointment.date);

                if (serviceDetail) {
                    // Update workedUnits and scheduledUnits
                    serviceDetail.workedUnits += unitsToAdd;
                    serviceDetail.scheduledUnits = Math.max(0, serviceDetail.scheduledUnits - unitsToAdd);
                } else {
                    // If no service detail exists for the date, create a new one
                    hcmEntry.serviceDetails.push({
                        dateOfService: appointment.date,
                        scheduledUnits: Math.max(0, unitsToAdd), // Assuming unitsUsed is the initial scheduled units
                        workedUnits: unitsToAdd,
                        methodOfContact: appointment.methodOfContact,
                        placeOfService: appointment.placeOfService
                    });
                }

                // Update the overall units remaining
                serviceTracking.unitsRemaining = Math.max(0, serviceTracking.unitsRemaining - unitsToAdd);

                // Save the updated service tracking
                const updatedServiceTracking = await serviceTracking.save();
            }

            serviceTrackingInfo = await serviceTracking.save();
        }

        res.status(200).json({
            success: true,
            message: "Appointment created successfully",
            response: {
                appointment: populatedAppointment,
                serviceTracking: serviceTrackingInfo
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Error creating schedule"
        });
    }
};

// export const getAppointments = async (req, res) => {
//     try {
//         const { companyId } = req.params;
//         const appointments = await appointments.find({ companyId });
//         res.status(200).json({ success: true, message: 'Appointments fetched successfully', appointments });
//     } catch (error) {
//         console.error('Error in getAppointments:', error);
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// }

export const updateCompletedAppointments = async (req, res) => {
    try {
        const now = new Date();
        const completedAppointments = await appointments.find({
            status: 'completed',
            date: { $lte: now }
        });

        for (const appointment of completedAppointments) {
            const exists = await CompletedAppointments.findOne({ appointmentId: appointment._id });
            if (!exists) {
                await CompletedAppointments.create({ appointmentId: appointment._id });

                // Calculate units used
                const durationInMinutes = (new Date(appointment.endTime) - new Date(appointment.startTime)) / 60000;
                const unitsUsed = Math.ceil(durationInMinutes / 15); // 15 minutes = 1 unit

                // Update service tracking
                const serviceTracking = await ServiceTracking.findOne({ hcmId: appointment.hcmId, serviceType: appointment.serviceType });
                if (serviceTracking) {
                    serviceTracking.unitsRemaining = Math.max(0, serviceTracking.unitsRemaining - unitsUsed);
                    await serviceTracking.save();
                } else {
                    await ServiceTracking.create({
                        hcmId: appointment.hcmId,
                        serviceType: appointment.serviceType,
                        unitsRemaining: Math.max(0, 150 - unitsUsed)
                    });
                }

                // Create a visit entry
                const response = await Visits.create({
                    tenantId: appointment.tenantId,
                    hcmId: appointment.hcmId,
                    serviceType: appointment.serviceType,
                    activity: appointment.activity || '',
                    date: appointment.date,
                    startTime: appointment.startTime || '',
                    endTime: appointment.endTime || '',
                    place: appointment.place || '',
                    methodOfVisit: appointment.methodOfVisit || 'in-person',
                    reasonForRemote: appointment.reasonForRemote || '',
                    notes: appointment.notes || '',
                    travel: appointment.travel || 'no',
                    totalMiles: appointment.totalMiles || 0,
                    travelWithTenant: appointment.travelWithTenant || 0,
                    travelWithoutTenant: appointment.travelWithoutTenant || 0,
                    signature: 'not done',
                    status: 'completed',
                    response: ''
                });
            }
        }
        res.status(200).send({ success: true, message: 'Completed appointments updated successfully.', response });
    } catch (error) {
        console.error('Error updating completed appointments:', error);
        res.status(500).send('Internal Server Error');
    }
};

export const markAppointmentComplete = async (req, res) => {
    const { id } = req.params;
    const appointmentId = new mongoose.Types.ObjectId(id);
    try {
        const appointment = await appointments.findById(appointmentId);

        if (!appointment) {
            return res.status(200).json({ success: false, message: 'Appointment not found' });
        }

        // Update the status to 'completed'
        appointment.status = 'completed';
        const updatedAppointment = await appointment.save();

        // Create a visit entry
        const visitEntry = new Visits({
            creatorId: new mongoose.Types.ObjectId(appointment.hcmId) ?? '',
            tenantId: new mongoose.Types.ObjectId(appointment.tenantId) ?? '',
            hcmId: new mongoose.Types.ObjectId(appointment.hcmId) ?? '',
            serviceType: appointment.serviceType ?? '',
            activity: appointment.activity ?? '',
            date: appointment.date ?? new Date(),
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            place: appointment.placeOfService ?? '',
            methodOfVisit: appointment.methodOfContact ?? 'in-person',
            reasonForRemote: appointment.reasonForRemote ?? '',
            notes: appointment.notes ?? '',
            travel: appointment.travel ?? 'no',
            totalMiles: appointment.totalMiles ?? 0,
            travelWithTenant: appointment.travelWithTenant ?? 0,
            travelWithoutTenant: appointment.travelWithoutTenant ?? 0,
            signature: 'not done',
            status: 'pending',
            response: '',
            companyId: new mongoose.Types.ObjectId(appointment.companyId)
        });

        const savedVisitEntry = await visitEntry.save(); // Save the visit entry to the collection

        const serviceTracking = await ServiceTracking.findOne({ tenantId: appointment.tenantId, serviceType: appointment.serviceType });
        let updatedServiceTracking;
        if (serviceTracking) {
            const durationInMinutes = (new Date(appointment.endTime) - new Date(appointment.startTime)) / 60000;
            const unitsUsed = Math.ceil(durationInMinutes / 15); // 15 minutes = 1 unit

            serviceTracking.workingUnits += unitsUsed;
            serviceTracking.scheduledUnits -= unitsUsed;
            serviceTracking.unitsRemaining = Math.max(0, serviceTracking.unitsRemaining - unitsUsed);
            updatedServiceTracking = await serviceTracking.save();

            const hcmEntry = serviceTracking.hcmIds.find(hcm => hcm.hcmId && hcm.hcmId.toString() === appointment.hcmId);

            if (hcmEntry) {
                // Find the service detail for the specific date
                const serviceDetail = hcmEntry.serviceDetails.find(service => service.dateOfService === appointment.date);

                if (serviceDetail) {
                    // Update workedUnits and scheduledUnits
                    serviceDetail.workedUnits += unitsUsed;
                    serviceDetail.scheduledUnits = Math.max(0, serviceDetail.scheduledUnits - unitsUsed);
                } else {
                    // If no service detail exists for the date, create a new one
                    hcmEntry.serviceDetails.push({
                        dateOfService: appointment.date,
                        scheduledUnits: Math.max(0, unitsUsed), // Assuming unitsUsed is the initial scheduled units
                        workedUnits: unitsUsed,
                        methodOfContact: appointment.methodOfContact,
                        placeOfService: appointment.placeOfService
                    });
                }

                // Update the overall units remaining
                serviceTracking.unitsRemaining = Math.max(0, serviceTracking.unitsRemaining - unitsUsed);

                // Save the updated service tracking
                updatedServiceTracking = await serviceTracking.save();
            }
        }

        res.status(200).json({
            success: true, message: 'Appointment marked as completed successfully.', response: {
                updatedAppointment: updatedAppointment,
                visitEntry: visitEntry,
                updatedServiceTracking: updatedServiceTracking
            }
        });
    } catch (error) {
        console.error('Error marking appointment as completed:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error', response: error.message });
    }
};

export const getUnitsLeft = async (req, res) => {
    try {
        const { tenantId, serviceType, companyId } = req.body;
        const serviceTracking = await ServiceTracking.findOne({ tenantId, serviceType, companyId });
        if (serviceTracking) {
            return res.status(200).json({ success: true, message: 'Units left fetched successfully', unitsLeft: serviceTracking.unitsRemaining });
        }
        else {
            return res.status(200).json({ success: true, message: 'No service tracking found', unitsLeft: 0 });
        }
    }
    catch (error) {
        console.error('Error in getUnitsLeft:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error', response: error.message });
    }
}