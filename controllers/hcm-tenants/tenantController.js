import users from '../../models/account/users.js';
import tenantInfo from '../../models/hcm-tenants/tenantInfo.js';
import bcrypt from 'bcrypt';
import HcmAppointments from '../../models/appointments-visits/appointments.js';
import mongoose from 'mongoose';
import hcmAssignedToTenant from '../../models/hcm-tenants/hcmAssignedToTenant.js';
import TenantHistory from '../../models/hcm-tenants/tenantHistory.js';
import Visits from '../../models/appointments-visits/visits.js';
import ServiceTracking from '../../models/bills/serviceTracking.js';
import tenantNotes from '../../models/hcm-tenants/tenantNotes.js';
import Company from '../../models/account/company.js';

function generateControlNumber() {
  return String(Math.floor(Math.random() * 1000000)).padStart(6, '0'); // 6-digit control number
}

const groupControlNumber = generateControlNumber();

export const createTenant = async (req, res) => {
  try {
    const { companyId } = req.body;
    const tenantData =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // Check if a user already exists with the same email
    const existingUser = await users.findOne({
      email: tenantData.personalInfo.email,
      companyId,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists.',
      });
    }

    const companyRecord = await Company.findOne({ _id: companyId });

    // Proceed with creating a new tenant
    const newInfo = new tenantInfo(tenantData);
    const savedInfo = await newInfo.save();

    const fullName = `${tenantData.personalInfo.firstName} ${tenantData.personalInfo.middleName} ${tenantData.personalInfo.lastName}`;
    const hashedPassword = await bcrypt.hash(tenantData.loginInfo.password, 10);

    const newUser = new users({
      name: fullName,
      email: tenantData.personalInfo.email,
      password: hashedPassword,
      phoneNo: tenantData.contactInfo.phoneNumber,
      info_id: savedInfo._id,
      role: 0,
      companyId,
      companyName: companyRecord.companyName
    });
    await newUser.save();

    res.status(200).json({
      success: true,
      message:
        'Tenant data recorded, Info record created, User created, and Bill created successfully.',
      response: {
        tenantID: newUser._id,
        tenantData: savedInfo,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating tenant data',
    });
  }
};

export const tenantVisitHistory = async (req, res) => {
  try {
    const { tenantId, companyId } = req.body;
    // Find visits for the given tenantId and populate hcm and tenant details
    const visits = await Visits.find({ tenantId, companyId })
      .populate({
        path: 'hcmId',
        select: '_id name', // Select only the id and name fields
        model: 'users',
      })
      .populate({
        path: 'tenantId',
        select: '_id name', // Select only the id and name fields
        model: 'users',
      })
      .select('serviceType date startTime endTime status'); // Select only the specified fields

    // Format the response
    const formattedVisits = visits.map((visit) => ({
      hcm: {
        id: visit.hcmId._id,
        name: visit.hcmId.name,
      },
      tenant: {
        id: visit.tenantId._id,
        name: visit.tenantId.name,
      },
      serviceType: visit.serviceType,
      date: visit.date,
      startTime: visit.startTime,
      endTime: visit.endTime,
      status: visit.status,
      companyId,
    }));

    res.status(200).json({
      success: true,
      message: 'Visit history fetched successfully',
      response: formattedVisits,
    });
  } catch (error) {
    console.error('Error fetching visit data:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching visit history data.',
      response: error.message,
    });
  }
};

export const updateTenant = async (req, res) => {
  try {
    const requestData =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { email, updatedById, tenantData } = requestData; // Correctly destructure the request data

    // Step 1: Check if a user already exists with the same email
    const existingUser = await users.findOne({ email });

    if (existingUser && existingUser.info_id !== '') {
      // Fetch the existing tenant info
      const existingInfo = await tenantInfo.findById(existingUser.info_id);

      if (!existingInfo) {
        return res.status(404).json({
          success: false,
          message: 'Tenant info not found.',
          response: null,
        });
      }
      const updatedPersonalInfo = {
        firstName:
          tenantData.personalInfo?.firstName ||
          existingInfo.personalInfo?.firstName,
        middleName:
          tenantData.personalInfo?.middleName ||
          existingInfo.personalInfo?.middleName,
        lastName:
          tenantData.personalInfo?.lastName ||
          existingInfo.personalInfo?.lastName,
        dob: tenantData.personalInfo?.dob || existingInfo.personalInfo?.dob,
        gender:
          tenantData.personalInfo?.gender || existingInfo.personalInfo?.gender,
        maPMINumber:
          tenantData.personalInfo?.maPMINumber ||
          existingInfo.personalInfo?.maPMINumber,
        email:
          tenantData.personalInfo?.email || existingInfo.personalInfo?.email,
      };
      const updatedInsuranceData = {
        insurance:
          tenantData.admissionInfo?.insurance ||
          existingInfo.admissionInfo?.insurance,
        insuranceNumber:
          tenantData.admissionInfo?.insuranceNumber ||
          existingInfo.admissionInfo?.insuranceNumber,
        ssn: tenantData.admissionInfo?.ssn || existingInfo.admissionInfo?.ssn,
        intakeDate:
          tenantData.admissionInfo?.intakeDate ||
          existingInfo.admissionInfo?.intakeDate,
        letGoDate:
          tenantData.admissionInfo?.letGoDate ||
          existingInfo.admissionInfo?.letGoDate,
        letGoReason:
          tenantData.admissionInfo?.letGoReason ||
          existingInfo.admissionInfo?.letGoReason,
        diagnosisCode:
          tenantData.admissionInfo?.diagnosisCode ||
          existingInfo.admissionInfo?.diagnosisCode,
      };
      const updatedMailingAddress = {
        line1:
          tenantData.mailingAddress?.line1 ||
          existingInfo.mailingAddress?.line1,
        line2:
          tenantData.mailingAddress?.line2 ||
          existingInfo.mailingAddress?.line2,
        city:
          tenantData.mailingAddress?.city || existingInfo.mailingAddress?.city,
        state:
          tenantData.mailingAddress?.state ||
          existingInfo.mailingAddress?.state,
        zipCode:
          tenantData.mailingAddress?.zipCode ||
          existingInfo.mailingAddress?.zipCode,
      };
      // Create a new emergencyContact object with all fields
      const updatedEmergencyContact = {
        firstName:
          tenantData.emergencyContact?.firstName ||
          existingInfo.emergencyContact?.firstName,
        middleName:
          tenantData.emergencyContact?.middleName ||
          existingInfo.emergencyContact?.middleName,
        lastName:
          tenantData.emergencyContact?.lastName ||
          existingInfo.emergencyContact?.lastName,
        phoneNumber:
          tenantData.emergencyContact?.phoneNumber ||
          existingInfo.emergencyContact?.phoneNumber,
        email:
          tenantData.emergencyContact?.email ||
          existingInfo.emergencyContact?.email,
        relationship:
          tenantData.emergencyContact?.relationship ||
          existingInfo.emergencyContact?.relationship,
      };
      const contactInfo = {
        phoneNumber:
          tenantData.contactInfo?.phoneNumber ||
          existingInfo.contactInfo?.phoneNumber,
        email: tenantData.contactInfo?.email || existingInfo.contactInfo?.email,
        homePhone:
          tenantData.contactInfo?.homePhone ||
          existingInfo.contactInfo?.homePhone,
        cellPhone:
          tenantData.contactInfo?.cellPhone ||
          existingInfo.contactInfo?.cellPhone,
        race: tenantData.contactInfo?.race || existingInfo.contactInfo?.race,
        ethnicity:
          tenantData.contactInfo?.ethnicity ||
          existingInfo.contactInfo?.ethnicity,
      };
      const updatedResponsibleParty = {
        firstName:
          tenantData.responsibleParty?.firstName ||
          existingInfo.responsibleParty?.firstName,
        middleInitial:
          tenantData.responsibleParty?.middleInitial ||
          existingInfo.responsibleParty?.middleInitial,
        lastName:
          tenantData.responsibleParty?.lastName ||
          existingInfo.responsibleParty?.lastName,
        phoneNumber:
          tenantData.responsibleParty?.phoneNumber ||
          existingInfo.responsibleParty?.phoneNumber,
        email:
          tenantData.responsibleParty?.email ||
          existingInfo.responsibleParty?.email,
        relationship:
          tenantData.responsibleParty?.relationship ||
          existingInfo.responsibleParty?.relationship,
      };
      const updatedCaseManager = {
        firstName:
          tenantData.caseManager?.firstName ||
          existingInfo.caseManager?.firstName,
        middleName:
          tenantData.caseManager?.middleName ||
          existingInfo.caseManager?.middleName,
        lastName:
          tenantData.caseManager?.lastName ||
          existingInfo.caseManager?.lastName,
        phoneNumber:
          tenantData.caseManager?.phoneNumber ||
          existingInfo.caseManager?.phoneNumber,
        email: tenantData.caseManager?.email || existingInfo.caseManager?.email,
      };
      const updatedAddress = {
        addressLine1:
          tenantData.address?.addressLine1 ||
          existingInfo.address?.addressLine1,
        addressLine2:
          tenantData.address?.addressLine2 ||
          existingInfo.address?.addressLine2,
        city: tenantData.address?.city || existingInfo.address?.city,
        state: tenantData.address?.state || existingInfo.address?.state,
        zipCode: tenantData.address?.zipCode || existingInfo.address?.zipCode,
        mailingSameAsAbove:
          tenantData.address?.mailingSameAsAbove ||
          existingInfo.address?.mailingSameAsAbove,
        mailingDifferent:
          tenantData.address?.mailingDifferent ||
          existingInfo.address?.mailingDifferent,
      };
      const updatedLoginInfo = {
        userName:
          tenantData.loginInfo?.userName || existingInfo.loginInfo?.userName,
        password:
          tenantData.loginInfo?.password || existingInfo.loginInfo?.password,
      };

      const updatedTenantInfo = {
        personalInfo: updatedPersonalInfo,
        address: updatedAddress,
        contactInfo: contactInfo,
        emergencyContact: updatedEmergencyContact,
        admissionInfo: updatedInsuranceData,
        caseManager: updatedCaseManager,
        mailingAddress: updatedMailingAddress,
        loginInfo: updatedLoginInfo,
        responsibleParty: updatedResponsibleParty,
      };
      // Update the associated info document
      const updatedInfo = await tenantInfo.findByIdAndUpdate(
        existingUser.info_id,
        updatedTenantInfo,
        { new: true }
      );

      // Construct the name only if the fields exist
      const nameParts = [];
      if (updatedTenantInfo.personalInfo?.firstName)
        nameParts.push(
          updatedTenantInfo.personalInfo?.firstName ||
          existingUser.personalInfo?.firstName
        );
      if (updatedTenantInfo.personalInfo?.middleName)
        nameParts.push(
          updatedTenantInfo.personalInfo?.middleName ||
          existingUser.personalInfo?.middleName
        );
      if (updatedTenantInfo.personalInfo?.lastName)
        nameParts.push(
          updatedTenantInfo.personalInfo?.lastName ||
          existingUser.personalInfo?.lastName
        );
      const name = nameParts.join(' ');

      // Update the user document with the relevant fields
      const userUpdateData = {};
      if (name) userUpdateData.name = name;
      if (updatedTenantInfo.personalInfo?.email)
        userUpdateData.email =
          updatedTenantInfo.personalInfo.email ||
          existingUser.personalInfo.email;
      if (updatedTenantInfo.contactInfo?.phoneNumber)
        userUpdateData.phoneNo =
          updatedTenantInfo.contactInfo.phoneNumber ||
          existingUser.contactInfo.phoneNumber;
      if (updatedTenantInfo.contactInfo?.email)
        userUpdateData.email =
          updatedTenantInfo.contactInfo.email || existingUser.contactInfo.email;

      const updatedUser = await users.findByIdAndUpdate(
        existingUser._id,
        userUpdateData,
        { new: true }
      );

      // Retrieve the name of the user who made the update
      // const updater = await users.findById(updatedById);
      // const updatedBy = updater ? updater.name : 'Unknown';

      // // Log the update in tenantHistory
      // const historyEntry = new TenantHistory({
      //   tenantId: existingUser._id,
      //   updatedFields: updatedInfo,
      //   updatedBy,
      //   updatedById
      // });
      // await historyEntry.save();

      return res.status(200).json({
        success: true,
        message: 'Existing tenant data updated successfully.',
        response: {
          tenantID: existingUser._id,
          tenantData: updatedInfo,
          userData: updatedUser,
          // historyData: historyEntry
        },
      });
    } else {
      // Handle case where no existing user is found
      res
        .status(400)
        .json({ success: false, message: 'Tenant not found.', response: null });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating tenant data',
      response: error.message,
    });
  }
};
export const deleteTenant = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedTenant = await users.findByIdAndDelete(id);
    const deletedTenantInfo = await tenantInfo.findByIdAndDelete(
      deletedTenant.info_id
    );
    res.status(200).json({
      success: true,
      message: 'Tenant deleted successfully',
      response: {
        'deleted tenant': deletedTenant,
        'deleted tenant info': deletedTenantInfo,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting tenant',
      response: error.message,
    });
  }
};

export const tenantProfileEditHistory = async (req, res) => {
  try {
    const { tenantId } = req.body;
    const history = await TenantHistory.find({ tenantId });
    res.status(200).json({
      success: true,
      message: 'Tenant profile edit history fetched successfully',
      response: history,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching tenant profile edit history',
      response: error.message,
    });
  }
};

export const assignServicesAndDocuments = async (req, res) => {
  try {
    const serviceData = req.body;

    const {
      tenantId,
      serviceType,
      startDate,
      endDate,
      unitsRemaining,
      totalUnits,
      billRate,
      companyId
    } = serviceData;

    // Validate required fields
    if (
      !tenantId ||
      !serviceType ||
      !startDate ||
      !endDate ||
      !unitsRemaining ||
      !totalUnits ||
      !billRate
    ) {
      return res.status(400).json({
        success: false,
        message: 'All service fields are required',
      });
    }

    // Validate tenantId
    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tenant ID format',
      });
    }

    // Check if tenant exists
    const tenant = await users.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    // Create new service tracking record
    const newServiceTracking = new ServiceTracking({
      tenantId,
      serviceType,
      startDate: new Date(startDate), // Ensure startDate is a Date object
      endDate: new Date(endDate), // Ensure endDate is a Date object
      unitsRemaining: Number(unitsRemaining),
      totalUnits: Number(totalUnits),
      billRate: Number(billRate),
      hcmIds: [], // Initialize hcmIds as an empty array
    });

    // Save the service tracking
    await newServiceTracking.save();

    res.status(200).json({
      success: true,
      message: 'Service assigned successfully',
      response: newServiceTracking,
    });
  } catch (error) {
    console.error('Error in assignServicesAndDocuments:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error assigning service and document',
    });
  }
};

// Add a new controller to update service status
export const updateServiceStatus = async (req, res) => {
  try {
    const { serviceId, status, reviewStatus } = req.body;

    // Validate serviceId presence
    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Service ID is required',
      });
    }

    // Validate serviceId format
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID format',
      });
    }

    // Validate at least one status is being updated
    if (!status && !reviewStatus) {
      return res.status(400).json({
        success: false,
        message: 'Either status or reviewStatus must be provided',
      });
    }

    // Validate status values if provided
    if (
      status &&
      !['pending', 'active', 'completed', 'cancelled'].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    // Validate reviewStatus values if provided
    if (
      reviewStatus &&
      !['pending', 'approved', 'rejected'].includes(reviewStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reviewStatus value',
      });
    }

    // Rest of your existing implementation...
    const service = await TenantService.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    if (status) service.status = status;
    if (reviewStatus) service.reviewStatus = reviewStatus;

    const updatedService = await service.save();

    res.status(200).json({
      success: true,
      message: 'Service status updated successfully',
      response: updatedService,
    });
  } catch (error) {
    console.error('Error in updateServiceStatus:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating service status',
    });
  }
};

// Get all services and documents for a tenant
export const getServicesAndDocuments = async (req, res) => {
  try {
    const { tenantId } = req.body;

    if (!tenantId) {
      return res.status(303).json({
        success: false,
        message: 'Tenant ID is required',
      });
    }

    // Validate tenantId format
    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(303).json({
        success: false,
        message: 'Invalid tenant ID format',
      });
    }

    // Check if tenant exists
    const tenant = await users.findById(tenantId);
    if (!tenant) {
      return res.status(303).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    // Find all services for this tenant with populated tenant details
    const services = await serviceTracking
      .find({ tenantId })
      .populate({
        path: 'tenantId',
        select: 'name email phoneNo',
        model: 'users',
      })
      .sort({ createdAt: -1 }); // Sort by newest first

    // Format the response
    const formattedServices = services.map((service) => ({
      ...service.toObject(),
      tenantDetails: service.tenantId,
    }));

    if (!services || services.length === 0) {
      return res.status(303).json({
        success: false,
        message: 'No services found for this tenant',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Services fetched successfully',
      response: formattedServices,
    });
  } catch (error) {
    console.error('Error in getServicesAndDocuments:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching services',
    });
  }
};

export const createAppointment = async (req, res) => {
  try {
    const appointmentData =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const {
      tenantId,
      hcmId,
      date,
      startTime,
      endTime,
      activity,
      methodOfContact,
      reasonForRemote,
      placeOfService,
      serviceType,
      companyId,
    } = appointmentData;

    // Validate required fields
    if (
      !tenantId ||
      !hcmId ||
      !date ||
      !startTime ||
      !endTime ||
      !activity ||
      !methodOfContact ||
      !placeOfService ||
      !serviceType
    ) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(tenantId) ||
      !mongoose.Types.ObjectId.isValid(hcmId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tenant ID or HCM ID format',
      });
    }

    // Check if tenant and HCM exist
    const [tenant, hcm] = await Promise.all([
      users.findById(tenantId),
      users.findById(hcmId),
    ]);

    if (!tenant || !hcm) {
      return res.status(404).json({
        success: false,
        message: 'Tenant or HCM not found',
      });
    }

    // Validate methodOfContact and reasonForRemote
    if (methodOfContact === 'remote' && !reasonForRemote) {
      return res.status(400).json({
        success: false,
        message: 'Reason for remote contact is required when method is remote',
      });
    }

    // Validate date format and ensure it's not in the past
    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate) || appointmentDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date or date is in the past',
      });
    }

    // Parse startTime and endTime as Date objects
    const appointmentStartTime = new Date(startTime);
    const appointmentEndTime = new Date(endTime);

    // Ensure startTime is before endTime
    if (appointmentStartTime >= appointmentEndTime) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be before end time.',
        response: null,
      });
    }

    // Calculate the duration in hours
    const durationInHours =
      (appointmentEndTime - appointmentStartTime) / (1000 * 60 * 60);

    // Convert hours to units (150 hours = 600 units, so 1 hour = 4 units)
    let unitsToAdd = durationInHours * 4;
    unitsToAdd = parseFloat(unitsToAdd.toFixed(2)); // Round to two decimal places

    // Find the service tracking record
    let serviceTracking = await ServiceTracking.findOne({
      tenantId,
      serviceType,
    });
    if (!serviceTracking) {
      // Create a new service tracking record with default values
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1); // Set end date to one year from now

      serviceTracking = new ServiceTracking({
        tenantId,
        serviceType,
        startDate,
        endDate,
        unitsRemaining: 600 - unitsToAdd,
        totalUnits: 600,
        billRate: 17.17,
        scheduledUnits: unitsToAdd,
        hcmIds: [
          {
            hcmId,
            serviceDetails: [
              {
                dateOfService: appointmentDate,
                scheduledUnits: unitsToAdd,
                workedUnits: 0, // Initially 0, will be updated after the appointment
                methodOfContact,
                placeOfService,
              },
            ],
          },
        ],
        companyId,
      });

      await serviceTracking.save();
    } else {
      // Check if there are enough units available
      if (
        serviceTracking.scheduledUnits + unitsToAdd >
        serviceTracking.unitsRemaining
      ) {
        return res.status(400).json({
          success: false,
          message: 'Not enough units available to schedule this appointment.',
          response: serviceTracking,
        });
      }

      // Update scheduledUnits
      serviceTracking.scheduledUnits += unitsToAdd;
      serviceTracking.unitsRemaining -= unitsToAdd;

      // Find the HCM entry and add the service detail
      const hcmEntry = serviceTracking.hcmIds.find(
        (hcm) => hcm.hcmId && hcm.hcmId.toString() === hcmId
      );
      if (hcmEntry) {
        hcmEntry.serviceDetails.push({
          dateOfService: appointmentDate,
          scheduledUnits: unitsToAdd,
          workedUnits: 0, // Initially 0, will be updated after the appointment
          methodOfContact,
          placeOfService,
        });
      } else {
        // If HCM entry doesn't exist, create a new one
        serviceTracking.hcmIds.push({
          hcmId,
          serviceDetails: [
            {
              dateOfService: appointmentDate,
              scheduledUnits: unitsToAdd,
              workedUnits: 0, // Initially 0, will be updated after the appointment
              methodOfContact,
              placeOfService,
            },
          ],
        });
      }

      await serviceTracking.save();
    }

    // Create appointment data only if units are available
    const newAppointment = new HcmAppointments({
      tenantId,
      hcmId,
      date: appointmentDate,
      startTime: appointmentStartTime,
      endTime: appointmentEndTime,
      activity,
      methodOfContact,
      reasonForRemote:
        methodOfContact === 'remote' ? reasonForRemote : undefined,
      placeOfService,
      serviceType,
      approved: false,
      status: 'pending',
      companyId,
    });

    // Save the appointment
    const savedAppointment = await newAppointment.save();

    // Fetch the saved appointment with populated fields
    const populatedAppointment = await HcmAppointments.findById(
      savedAppointment._id
    )
      .populate({
        path: 'hcmId',
        select: 'name email phoneNo',
        model: 'causers',
      })
      .populate({
        path: 'tenantId',
        select: 'name email phoneNo',
        model: 'causers',
      });

    // Format the response to include user details and service tracking
    const formattedResponse = {
      appointmentData: populatedAppointment.toObject(),
      hcmDetails: populatedAppointment.hcmId,
      tenantDetails: populatedAppointment.tenantId,
      serviceTracking: serviceTracking,
    };

    res.status(200).json({
      success: true,
      message: 'Appointment created successfully',
      response: formattedResponse,
    });
  } catch (error) {
    console.error('Error in createAppointment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating appointment',
    });
  }
};

export const getAllTenants = async (req, res) => {
  const { companyId } = req.params;
  const companyObjectId = new mongoose.Types.ObjectId(companyId);
  try {
    const tenants = await users.find({ role: 0, companyId: companyObjectId });

    const tenantsRecords = [];
    const cities = [];
    const insurance = [];

    for (const tenant of tenants) {
      const tenantInfoRecord = await tenantInfo.findOne({
        _id: tenant.info_id,
      });
      cities.push(tenantInfoRecord.address.city);
      insurance.push(tenantInfoRecord.admissionInfo.insurance);

      const services = [];
      const serviceTracking = await ServiceTracking.find({
        tenantId: tenant._id,
      });

      for (const service of serviceTracking) {
        services.push(service.serviceType);
      }
      tenantsRecords.push({
        id: tenant._id,
        name: tenant.name,
        email: tenant.email,
        phoneNo: tenant.phoneNo,
        tenantInfo: tenantInfoRecord,
        services: services,

      });
    }
    return res.status(200).json({
      success: true,
      message: 'Tenants fetched successfully',
      response: {
        tenants: tenantsRecords,
        cities,
        insurance,
      },
    });
  } catch (error) {
    console.error('Error in getAllTenants:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching tenants',
    });
  }
};

export const getTenant = async (req, res) => {
  const { id } = req.params;
  const tenantId = new mongoose.Types.ObjectId(id);
  try {
    const tenant = await users.findById(tenantId);
    const tenantInfoRecord = await tenantInfo.findOne({ _id: tenant.info_id });
    return res.status(200).json({
      success: true,
      message: 'Tenant fetched successfully',
      response: {
        tenant: tenant,
        tenantInfo: tenantInfoRecord,
      },
    });
  } catch (error) {
    console.error('Error in getTenant:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching tenant',
      error: error.message || error,
    });
  }
};

export const getTenantChartInfo = async (req, res) => {
  const { companyId } = req.params;
  try {
    // Find all tenants with role 0
    const tenants = await users.find({ role: 0, companyId });
    console.log(tenants)
    // Initialize the data structure for the response
    const data = {};

    // Process each tenant
    tenants.forEach((tenant) => {
      const year = new Date().getFullYear().toString();
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];

      if (tenant.movedOut) {
        const movedOutDate = new Date(tenant.movedOutDate);
        const month = monthNames[movedOutDate.getMonth()];
        const year = movedOutDate.getFullYear().toString();

        if (!data[year]) {
          data[year] = {};
        }
        if (!data[year][month]) {
          data[year][month] = { movedOut: 0, receivingServices: 0 };
        }
        data[year][month].movedOut++;
      } else {
        const currentMonth = monthNames[new Date().getMonth()];
        if (!data[year]) {
          data[year] = {};
        }
        if (!data[year][currentMonth]) {
          data[year][currentMonth] = { movedOut: 0, receivingServices: 0 };
        }
        data[year][currentMonth].receivingServices++;
      }
    });

    res.status(200).json({
      success: true,
      message: 'Tenant info fetched successfully',
      response: data,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const tenantReassessments = async (req, res) => {
  const { companyId } = req.params;
  try {
    const tenants = await ServiceTracking.find({ companyId })
      .populate({
        path: 'tenantId',
        select: '_id name email',
        model: 'causers',
      })
      .populate({
        path: 'hcmIds.hcmId',
        select: '_id name email',
        model: 'causers',
      });

    const today = new Date();
    const dayCounts = { 90: 0, 60: 0, 30: 0, 15: 0, 5: 0 };
    const reassessmentData = { 90: [], 60: [], 30: [], 15: [], 5: [] };

    tenants.forEach((tenant) => {
      if (tenant.endDate) {
        const endDate = new Date(tenant.endDate);
        const diffTime = endDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 90) {
          dayCounts['90']++;
          reassessmentData['90'].push(
            createReassessmentDetail(tenant, diffDays)
          );
        }
        if (diffDays <= 60) {
          dayCounts['60']++;
          reassessmentData['60'].push(
            createReassessmentDetail(tenant, diffDays)
          );
        }
        if (diffDays <= 30) {
          dayCounts['30']++;
          reassessmentData['30'].push(
            createReassessmentDetail(tenant, diffDays)
          );
        }
        if (diffDays <= 15) {
          dayCounts['15']++;
          reassessmentData['15'].push(
            createReassessmentDetail(tenant, diffDays)
          );
        }
        if (diffDays <= 5) {
          dayCounts['5']++;
          reassessmentData['5'].push(
            createReassessmentDetail(tenant, diffDays)
          );
        }
      } else {
        console.warn(`End date is undefined for tenant with ID: ${tenant._id}`);
      }
    });

    res.status(200).json({
      success: true,
      message: 'Tenant reassessments fetched successfully',
      response: {
        reassessmentData,
        dayCounts,
      },
    });
  } catch (error) {
    console.error('Error in tenantReassessments:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

function createReassessmentDetail(tenant, diffDays) {
  return {
    tenantId: tenant.tenantId ? tenant.tenantId._id : 'Unknown Tenant ID',
    tenantName: tenant.tenantId ? tenant.tenantId.name : 'Unknown Tenant',
    tenantEmail: tenant.tenantId ? tenant.tenantId.email : 'Unknown Email',
    serviceType: tenant.serviceType,
    daysLeft: diffDays,
    period:
      tenant.startDate && tenant.endDate
        ? `${tenant.startDate.toISOString().split('T')[0]} to ${tenant.endDate.toISOString().split('T')[0]
        }`
        : 'Undefined',
    hcmDetails: tenant.hcmIds.map((hcm) => ({
      hcmId: hcm.hcmId ? hcm.hcmId._id : 'Unknown HCM ID',
      hcmName: hcm.hcmId ? hcm.hcmId.name : 'Unknown HCM',
      hcmEmail: hcm.hcmId ? hcm.hcmId.email : 'Unknown Email',
    })),
    unitsLeft: tenant.unitsRemaining || 0,
    scheduledUnits: tenant.scheduledUnits || 0,
  };
}

// Assign HCM to a Tenant
export const assignHcmsToTenant = async (req, res) => {
  try {
    const { tenantId, hcmIds, companyId } = req.body;

    // Validate required fields
    if (!tenantId || !hcmIds || !Array.isArray(hcmIds) || !companyId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID and an array of HCM IDs & conmpany ID are required',
      });
    }

    // Validate Tenant ID
    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Tenant ID format',
      });
    }

    // Validate each HCM ID
    for (const hcmId of hcmIds) {
      if (!mongoose.Types.ObjectId.isValid(hcmId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid HCM ID format: ${hcmId}`,
        });
      }
    }

    // Check if assignment already exists
    let assignment = await hcmAssignedToTenant.findOne({ tenantId, companyId });
    if (assignment) {
      // Add new HCM IDs to the existing assignment
      hcmIds.forEach((hcmId) => {
        if (!assignment.hcmIds.includes(hcmId)) {
          assignment.hcmIds.push(hcmId);
        }
      });
      await assignment.save();
    } else {
      // Create new assignment
      assignment = new hcmAssignedToTenant({
        tenantId,
        hcmIds,
        companyId,
      });
      await assignment.save();
    }

    return res.status(200).json({
      success: true,
      message: 'HCMs assigned to tenant successfully',
      response: assignment,
    });
  } catch (error) {
    console.error('Error in assignHcmsToTenant:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing HCM assignment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Get Assigned HCMs to a Tenant
export const getAssignedHcmsToTenant = async (req, res) => {
  const { tenantId } = req.body;

  try {
    // Validate tenantId
    if (!tenantId) {
      return res
        .status(400)
        .json({ success: false, message: 'Tenant ID is required.' });
    }

    // Validate tenantId format
    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid Tenant ID format.' });
    }

    // Find the assignment for the given tenantId and populate complete HCM details
    const assignment = await hcmAssignedToTenant
      .findOne({ tenantId })
      .populate({
        path: 'hcmIds',
        model: 'causers', // Fetch all fields for each user
      });

    if (!assignment) {
      return res
        .status(300)
        .json({ success: false, message: 'No HCMs assigned to this tenant.' });
    }

    // Return the complete user details
    return res.status(200).json({
      success: true,
      message: 'HCMs assigned to tenant fetched successfully',
      response: assignment.hcmIds,
    });
  } catch (error) {
    console.error('Error fetching assigned HCMs:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching assigned HCMs.',
      error: error.message || error,
    });
  }
};

export const getTenantInfoById = async (req, res) => {
  try {
    const { tenantInfoId, companyId } = req.body;
    const tenantInformation = await tenantInfo.findById(tenantInfoId);
    return res.status(200).json({
      success: true,
      message: 'Tenant info fetched successfully',
      response: tenantInformation,
    });
  } catch (error) {
    console.error('Error in getTenantInfoById:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching tenant info',
      error: error.message || error,
    });
  }
};

export const createOrUpdateServiceTracking = async (
  tenantId,
  hcmId,
  serviceType,
  unitsToAdd,
  durationInHours,
  companyId
) => {
  // Find the service tracking record
  let serviceTracking = await ServiceTracking.findOne({
    tenantId,
    serviceType,
    companyId,
  });

  if (!serviceTracking) {
    // Create a new service tracking record with default values
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // Set end date to one year from now

    serviceTracking = new ServiceTracking({
      tenantId,
      serviceType,
      startDate,
      endDate,
      unitsRemaining: 600 - unitsToAdd,
      totalUnits: 600,
      billRate: 17.17,
      scheduledUnits: unitsToAdd,
      workedUnits: unitsToAdd,
      workedHours: durationInHours,
      hcmIds: [
        { hcmId, workedUnits: unitsToAdd, workedHours: durationInHours },
      ],
    });

    await serviceTracking.save();
  } else {
    // Update scheduledUnits, workedUnits, and workedHours
    serviceTracking.scheduledUnits += unitsToAdd;
    serviceTracking.unitsRemaining -= unitsToAdd;
    serviceTracking.workedUnits += unitsToAdd;
    serviceTracking.workedHours += durationInHours;

    // Merge existing hcmIds with the new one
    const hcmEntry =
      serviceTracking.hcmIds.length === 1 ? serviceTracking.hcmIds[0] : null;
    if (hcmEntry && hcmEntry.hcmId === hcmId) {
      hcmEntry.workedUnits += unitsToAdd;
      hcmEntry.workedHours += durationInHours;
    } else {
      serviceTracking.hcmIds.push({
        hcmId,
        workedUnits: unitsToAdd,
        workedHours: durationInHours,
      });
    }

    await serviceTracking.save();
  }
};

export const addTenantNote = async (req, res) => {
  try {
    const { tenantId, content, notedBy, title } = req.body;

    // Find the tenant notes document
    let TenantNotes = await tenantNotes.findOne({ tenantId });

    if (!TenantNotes) {
      // If no document exists, create a new one
      TenantNotes = new tenantNotes({
        tenantId,
        notes: [
          {
            noteId: 1,
            content,
            notedBy,
            title,
          },
        ],
        noteCounter: 1,
      });
    } else {
      // Increment the note counter and add the new note
      const newNoteId = TenantNotes.noteCounter + 1;
      TenantNotes.notes.push({
        noteId: newNoteId,
        content,
        notedBy,
        title,
      });
      TenantNotes.noteCounter = newNoteId;
    }

    await TenantNotes.save();

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      response: {
        tenantNotes: TenantNotes,
      },
    });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      response: error.message,
    });
  }
};

export const getTenantNotes = async (req, res) => {
  try {
    const { tenantId } = req.body;
    const tenantNotesDocument = await tenantNotes
      .findOne({ tenantId })
      .populate({
        path: 'notes.notedBy',
        select: '-accountSetup -passwordChangedAt',
      });

    if (!tenantNotesDocument) {
      return res
        .status(404)
        .json({ success: false, message: 'Tenant notes not found' });
    }

    // Refine the response to exclude _id, tenantId, noteCounter, and _id inside notes
    const refinedNotes = tenantNotesDocument.notes.map((note) => ({
      noteId: note.noteId,
      content: note.content,
      title: note.title,
      notedBy: note.notedBy,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      message: 'Tenant notes fetched successfully',
      response: {
        tenantNotes: refinedNotes,
      },
    });
  } catch (error) {
    console.error('Error fetching tenant notes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tenant notes',
      error: error.message || error,
    });
  }
};

export const deleteTenantNote = async (req, res) => {
  try {
    const { tenantId, noteId } = req.body;

    // Find the tenant notes document
    const TenantNotes = await tenantNotes.findOne({ tenantId });

    if (!TenantNotes) {
      return res
        .status(400)
        .json({ success: false, message: 'Tenant notes not found' });
    }

    // Find the index of the note to be deleted
    const noteIndex = TenantNotes.notes.findIndex(
      (note) => note.noteId === noteId
    );

    // Check if the note exists
    if (noteIndex === -1) {
      return res
        .status(400)
        .json({ success: false, message: 'Note not found' });
    }

    // Remove the note from the array
    TenantNotes.notes.splice(noteIndex, 1);

    // Save the updated document
    await TenantNotes.save();

    return res.status(200).json({
      success: true,
      message: 'Tenant note deleted successfully',
      response: {
        'deleted Note': TenantNotes,
      },
    });
  } catch (error) {
    console.error('Error deleting tenant note:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      response: error.message,
    });
  }
};

export const updateTenantNote = async (req, res) => {
  try {
    const { tenantId, noteId, content, notedBy, title } = req.body;

    // Convert noteId to a number
    const noteIdNumber = Number(noteId);

    // Find the tenant notes document
    const TenantNotes = await tenantNotes.findOne({ tenantId });

    if (!TenantNotes) {
      return res
        .status(400)
        .json({ success: false, message: 'Tenant notes not found' });
    }

    // Find the index of the note to be updated
    const noteIndex = TenantNotes.notes.findIndex(
      (note) => note.noteId === noteIdNumber
    );

    // Check if the note exists
    if (noteIndex === -1) {
      return res
        .status(400)
        .json({ success: false, message: 'Note not found' });
    }

    // Retrieve the existing note
    const existingNote = TenantNotes.notes[noteIndex];

    // Update the note content, notedBy, and title if provided
    existingNote.content = content || existingNote.content;
    existingNote.notedBy = notedBy || existingNote.notedBy;
    existingNote.title = title || existingNote.title;
    existingNote.updatedAt = new Date();
    // Save the updated document
    await TenantNotes.save();

    return res.status(200).json({
      success: true,
      message: 'Tenant note updated successfully',
      response: {
        'updated Note': existingNote,
      },
    });
  } catch (error) {
    console.error('Error updating tenant note:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      response: error.message,
    });
  }
};

export const tenantsRunningOutOfUnits = async (req, res) => {
  try {
    const { companyId } = req.params;
    const tenants = await ServiceTracking.find({
      companyId,
      unitsRemaining: { $lt: 100 },
    });
    res.status(200).json({
      success: true,
      message: 'Tenants running out of units fetched successfully',
      response: {
        count: tenants.length,
      },
    });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, message: error.message, response: error });
  }
};
