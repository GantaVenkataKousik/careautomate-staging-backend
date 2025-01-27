import users from '../../models/account/users.js';
import bcrypt from 'bcrypt';
import HcmAppointments from '../../models/appointments-visits/appointments.js';
import Document from '../../models/communication-documents/document.js';
import mongoose from 'mongoose';
import tenantAssignedtoHcm from '../../models/hcm-tenants/tenantAssignedtoHcm.js';
import cloudinary from 'cloudinary';
import hcmInfo from '../../models/hcm-tenants/hcmInfo.js';
import Visits from '../../models/appointments-visits/visits.js';

//HCM Management Routes

const createHcm = async (req, res) => {
  try {
    const { hcmData, companyId } = req.body;
    console.log(hcmData);
    const companyObjectId = new mongoose.Types.ObjectId(companyId);
    // Log the incoming data to verify its structure
    console.log('Received hcmData:', hcmData);

    // Validate email presence
    if (!hcmData.loginInfo || !hcmData.loginInfo.username) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    // Step 1: Check if a user already exists with the same email
    const existingUser = await users.findOne({ email: hcmData.loginInfo.username });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "A user with this email already exists."
      });
    } else {
      // Step 2: Insert a new info document if no user exists
      const newInfo = new hcmInfo({
        ...hcmData,
        loginInfo: {
          username: hcmData.loginInfo.username,
          password: hcmData.loginInfo.password
        },
        companyId: companyObjectId
      });

      const savedInfo = await newInfo.save();

      // Step 3: Create a new user linked to the new info document
      const fullName = `${hcmData.personalInfo.firstName} ${hcmData.personalInfo.middleName} ${hcmData.personalInfo.lastName}`;
      const hashedPassword = await bcrypt.hash(hcmData.loginInfo.password, 10);

      const newUser = new users({
        name: fullName,
        email: hcmData.loginInfo.username,
        password: hashedPassword,
        phoneNo: hcmData.contactInfo.phoneNumber,
        info_id: savedInfo._id,
        role: 1,
        companyId: companyObjectId
      });
      const hcmRecord = await newUser.save();

      // Step 4: Send success response
      return res.status(200).json({
        success: true,
        message: "HCM data recorded, Info record created, and User created successfully.",
        response: {
          hcm: hcmRecord,
          hcmInfo: savedInfo
        }
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error creating HCM data"
    });
  }
};
const getHcm = async (req, res) => {
  const { id } = req.params;
  const hcmId = new mongoose.Types.ObjectId(id);
  try {
    const hcm = await users.findById(hcmId);
    const hcmInfoRecord = await hcmInfo.findOne({ _id: hcm.info_id });
    return res.status(200).json({ success: true, message: "HCM fetched successfully", response: { hcm, hcmInfoRecord } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching HCM data"
    });
  }
}

const getHcms = async (req, res) => {
  const { companyId } = req.params;
  const companyObjectId = new mongoose.Types.ObjectId(companyId);
  try {
    const hcms = await users.find({ role: 1, companyId: companyObjectId });
    const hcmsRecords = [];
    const cities = new Set();
    for (const hcm of hcms) {
      const hcmInfoRecord = await hcmInfo.findOne({ _id: hcm.info_id });
      cities.push(hcmInfoRecord.addressInfo.city);

      hcmsRecords.push({
        id: hcm._id,
        name: hcm.name,
        email: hcm.email,
        phoneNo: hcm.phoneNo,
        hcmData: hcmInfoRecord
      });
    }
    return res.status(200).json({
      success: true, message: "HCMs fetched successfully", response: {
        hcmsRecords,
        cities,
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching HCMs"
    });
  }
}

const updateHcm = async (req, res) => {
  try {
    const requestData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { email, hcmData, companyId, updatedById } = requestData;
    const existingUser = await users.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "HCM not found" });
    }
    const existingInfo = await hcmInfo.findOne({ _id: existingUser.info_id });
    if (!existingInfo) {
      return res.status(404).json({ success: false, message: "HCM info not found" });
    }
    const updatedPersonalInfo = {
      firstName: hcmData.personalInfo?.firstName || existingInfo.personalInfo?.firstName,
      middleName: hcmData.personalInfo?.middleName || existingInfo.personalInfo?.middleName,
      lastName: hcmData.personalInfo?.lastName || existingInfo.personalInfo?.lastName,
      dob: hcmData.personalInfo?.dob || existingInfo.personalInfo?.dob,
      gender: hcmData.personalInfo?.gender || existingInfo.personalInfo?.gender,
    }
    const updatedContactInfo = {
      phoneNumber: hcmData.contactInfo?.phoneNumber || existingInfo.contactInfo?.phoneNumber,
      email: hcmData.contactInfo?.email || existingInfo.contactInfo?.email,
      homePhone: hcmData.contactInfo?.homePhone || existingInfo.contactInfo?.homePhone,
      cellPhone: hcmData.contactInfo?.cellPhone || existingInfo.contactInfo?.cellPhone,
    }
    const updatedAddressInfo = {
      addressLine1: hcmData.addressInfo?.addressLine1 || existingInfo.addressInfo?.addressLine1,
      addressLine2: hcmData.addressInfo?.addressLine2 || existingInfo.addressInfo?.addressLine2,
      city: hcmData.addressInfo?.city || existingInfo.addressInfo?.city,
      state: hcmData.addressInfo?.state || existingInfo.addressInfo?.state,
      zipCode: hcmData.addressInfo?.zipCode || existingInfo.addressInfo?.zipCode,
      mailingAddress: hcmData.addressInfo?.mailingAddress || existingInfo.addressInfo?.mailingAddress,
    }
    const updatedEmploymentInfo = {
      employmentTitle: hcmData.employmentInfo?.employmentTitle || existingInfo.employmentInfo?.employmentTitle,
      hireDate: hcmData.employmentInfo?.hireDate || existingInfo.employmentInfo?.hireDate,
      terminationDate: hcmData.employmentInfo?.terminationDate || existingInfo.employmentInfo?.terminationDate,
      rateOfPay: hcmData.employmentInfo?.rateOfPay || existingInfo.employmentInfo?.rateOfPay,
      ssn: hcmData.employmentInfo?.ssn || existingInfo.employmentInfo?.ssn,
    }
    const updatedLoginInfo = {
      username: hcmData.loginInfo?.username || existingInfo.loginInfo?.username,
      password: hcmData.loginInfo?.password || existingInfo.loginInfo?.password,
    }
    const updatedHcmInfo = {
      personalInfo: updatedPersonalInfo,
      contactInfo: updatedContactInfo,
      addressInfo: updatedAddressInfo,
      employmentInfo: updatedEmploymentInfo,
      loginInfo: updatedLoginInfo,
      companyId
    }
    const hcm = await hcmInfo.findByIdAndUpdate(existingUser.info_id, updatedHcmInfo, { new: true });


    const nameParts = [];
    if (updatedHcmInfo.personalInfo?.firstName) nameParts.push(updatedHcmInfo.personalInfo?.firstName || existingInfo.personalInfo?.firstName);
    if (updatedHcmInfo.personalInfo?.middleName) nameParts.push(updatedHcmInfo.personalInfo?.middleName || existingInfo.personalInfo?.middleName);
    if (updatedHcmInfo.personalInfo?.lastName) nameParts.push(updatedHcmInfo.personalInfo?.lastName || existingInfo.personalInfo?.lastName);
    const name = nameParts.join(' ');



    const userUpdateData = {};
    if (name) userUpdateData.name = name;
    if (updatedHcmInfo.loginInfo?.username) userUpdateData.email = updatedHcmInfo.loginInfo?.username;
    if (updatedHcmInfo.contactInfo?.phoneNumber) userUpdateData.phoneNo = updatedHcmInfo.contactInfo?.phoneNumber;

    const updatedUser = await users.findByIdAndUpdate(existingUser._id, userUpdateData, { new: true });

    return res.status(200).json({
      success: true, message: "HCM updated successfully", response: {
        "updatedHcm": updatedUser,
        "updatedHcmInfo": updatedHcmInfo
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error updating HCM"
    });
  }
}

const deleteHcm = async (req, res) => {
  try {
    const { id } = req.params;
    const hcmId = new mongoose.Types.ObjectId(id);
    const deletedHcm = await users.findByIdAndDelete(hcmId);
    const deletedHcmInfo = await hcmInfo.findByIdAndDelete(deletedHcm.info_id);

    return res.status(200).json({
      success: true, message: "HCM deleted successfully", response: {
        "deletedHcm": deletedHcm,
        "deletedHcmInfo": deletedHcmInfo
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error deleting HCM"
    });
  }
}

const getHcmInfo = async (req, res) => {
  const { id } = req.params;
  try {
    const hcmId = new mongoose.Types.ObjectId(id);
    const hcm = await users.findById(hcmId);
    const hcmInfoRecord = await hcmInfo.findById(hcm.info_id);
    return res.status(200).json({
      success: true, message: "HCM info fetched successfully", response: {
        "hcmInfo": hcmInfoRecord
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching HCM info"
    });
  }
}
const getHcmChartInfo = async (req, res) => {
  const { companyId } = req.params;
  try {
    // Find all hcms with role 0
    const hcms = await users.find({ role: 1, companyId });

    // Initialize the data structure for the response
    const data = {};

    // Process each tenant
    hcms.forEach(hcm => {
      const year = new Date().getFullYear().toString();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      if (hcm.movedOut) {
        const movedOutDate = new Date(hcm.movedOutDate);
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
      message: "HCM chart info fetched successfully",
      response: data
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const assignServicesAndDocuments = async (req, res) => {
  try {
    const { hcmId, services } = req.body;

    // Validate hcmId
    if (!mongoose.Types.ObjectId.isValid(hcmId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid HCM ID format'
      });
    }

    // Check if HCM exists
    const hcmExists = await users.findById(hcmId);
    if (!hcmExists) {
      return res.status(404).json({
        success: false,
        message: 'HCM not found'
      });
    }

    // Validate services array
    if (!services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Services array is required and cannot be empty'
      });
    }

    const savedServices = [];

    // Process each service
    for (const service of services) {
      const { serviceType, startDate, endDate, units, rate, document } = service;

      // Validate required service fields
      if (!serviceType || !startDate || !endDate || !units || !rate) {
        return res.status(400).json({
          success: false,
          message: 'Missing required service fields: serviceType, startDate, endDate, units, and rate are required'
        });
      }
      // Create new service record
      const newService = new HcmService({
        hcmId,
        serviceType,
        startDate,
        endDate,
        units,
        rate,
        document: document,
        status: 'pending',
        reviewStatus: 'pending'
      });

      const savedService = await newService.save();
      savedServices.push(savedService);
    }

    res.status(200).json({
      success: true,
      message: 'Services assigned successfully',
      response: savedServices
    });

  } catch (error) {
    console.error('Error in assignServicesAndDocuments:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error assigning services and documents'
    });
  }
};
export const hcmVisitHistory = async (req, res) => {
  try {
    const { hcmId } = req.body;
    // Find visits for the given tenantId and populate hcm and tenant details
    const visits = await Visits.find({ hcmId })
      .populate({
        path: 'hcmId',
        select: '_id name', // Select only the id and name fields
        model: 'users'
      })
      .populate({
        path: 'tenantId',
        select: '_id name', // Select only the id and name fields
        model: 'users'
      })
      .select('serviceType date startTime endTime status'); // Select only the specified fields

    // Sort visits to find the most recent approved and rejected
    const recentApprovedVisit = visits
      .filter(visit => visit.status === 'approved' && visit.timeOfApproval)
      .sort((a, b) => new Date(b.timeOfApproval) - new Date(a.timeOfApproval))[0] || null;

    const recentRejectedVisit = visits
      .filter(visit => visit.status === 'rejected' && visit.timeOfRejection)
      .sort((a, b) => new Date(b.timeOfRejection) - new Date(a.timeOfRejection))[0] || null;

    // Format the response
    const formattedVisits = visits.map(visit => ({
      hcm: {
        id: visit.hcmId._id,
        name: visit.hcmId.name,
        ...(visit.hcmId.email && { email: visit.hcmId.email })
      },
      tenant: {
        id: visit.tenantId._id,
        name: visit.tenantId.name,
        ...(visit.tenantId.email && { email: visit.tenantId.email })
      },
      serviceType: visit.serviceType,
      date: visit.date,
      startTime: visit.startTime,
      endTime: visit.endTime,
      status: visit.status,
      ...(visit.reasonForRejection && { reasonForRejection: visit.reasonForRejection }),
      ...(visit.timeOfRejection && { timeOfRejection: visit.timeOfRejection }),
      ...(visit.timeOfApproval && { timeOfApproval: visit.timeOfApproval })
    }));

    res.status(200).json({
      success: true,
      message: "Visit history fetched successfully",
      response: {
        visits: formattedVisits,
        recentApproved: recentApprovedVisit ? {
          hcm: {
            id: recentApprovedVisit.hcmId._id,
            name: recentApprovedVisit.hcmId.name
          },
          tenant: {
            id: recentApprovedVisit.tenantId._id,
            name: recentApprovedVisit.tenantId.name
          },
          serviceType: recentApprovedVisit.serviceType,
          date: recentApprovedVisit.date,
          startTime: recentApprovedVisit.startTime,
          endTime: recentApprovedVisit.endTime,
          status: recentApprovedVisit.status
        } : null,
        recentRejected: recentRejectedVisit ? {
          hcm: {
            id: recentRejectedVisit.hcmId._id,
            name: recentRejectedVisit.hcmId.name
          },
          tenant: {
            id: recentRejectedVisit.tenantId._id,
            name: recentRejectedVisit.tenantId.name
          },
          serviceType: recentRejectedVisit.serviceType,
          date: recentRejectedVisit.date,
          startTime: recentRejectedVisit.startTime,
          endTime: recentRejectedVisit.endTime,
          status: recentRejectedVisit.status
        } : null
      }
    });
  } catch (error) {
    console.error("Error fetching visit data:", error);
    res.status(500).json({ success: false, message: "An error occurred while fetching visit history data.", response: error.message });
  }
};
const getServicesAndDocuments = async (req, res) => {
  try {
    const { hcmId } = req.body;

    if (!hcmId) {
      return res.status(400).json({
        success: false,
        message: "HCM ID is required"
      });
    }

    // Find all services for this HCM
    const services = await HcmService.find({ hcmId })
      .sort({ createdAt: -1 }); // Sort by newest first

    if (!services || services.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No services found for this HCM"
      });
    }

    res.status(200).json({
      success: true,
      message: "Services fetched successfully",
      response: services
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching services"
    });
  }
};

const createSchedule = async (req, res) => {
  try {
    const {
      hcmId,
      tenantId,
      serviceType,
      date,
      startTime,
      endTime,
      activity,
      methodOfContact,
      reasonForRemote,
      placeOfService
    } = req.body;

    // Validate required fields
    if (!hcmId || !tenantId || !serviceType || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'hcmId, tenantId, serviceType, date, startTime, and endTime are required.',
        response: null
      });
    }

    // Parse startTime and endTime as Date objects
    const scheduleStartTime = new Date(startTime);
    const scheduleEndTime = new Date(endTime);

    // Ensure startTime is before endTime
    if (scheduleStartTime >= scheduleEndTime) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be before end time.',
        response: null
      });
    }

    // Create the schedule
    const newSchedule = new HcmAppointments({
      hcmId,
      tenantId,
      serviceType,
      date,
      startTime: scheduleStartTime,
      endTime: scheduleEndTime,
      activity,
      methodOfContact,
      reasonForRemote,
      placeOfService
    });

    const savedAppointment = await newSchedule.save();

    // Fetch the saved appointment with populated fields
    const populatedAppointment = await HcmAppointments.findById(savedAppointment._id)
      .populate({
        path: 'hcmId',
        select: 'name email phoneNo',
        model: 'users'
      })
      .populate({
        path: 'tenantId',
        select: 'name email phoneNo',
        model: 'users'
      });

    // Format the response to include user details
    const formattedResponse = {
      ...populatedAppointment.toObject(),
      hcmDetails: populatedAppointment.hcmId,
      tenantDetails: populatedAppointment.tenantId,
    };

    res.status(200).json({
      success: true,
      message: "Appointment created successfully",
      response: formattedResponse
    });

  } catch (error) {
    console.error('Error in createSchedule:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating appointment"
    });
  }
};

const getAppointments = async (req, res) => {
  try {
    const { hcmId } = req.body;

    if (!hcmId) {
      return res.status(400).json({
        success: false,
        message: "HCM ID is required"
      });
    }

    // Validate hcmId format
    if (!mongoose.Types.ObjectId.isValid(hcmId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid HCM ID format"
      });
    }

    // Check if HCM exists
    const hcm = await users.findById(hcmId);
    if (!hcm) {
      return res.status(404).json({
        success: false,
        message: "HCM not found"
      });
    }

    // Fetch appointments with populated user details
    const appointments = await HcmAppointments.find({ hcmId })
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
      .sort({ date: 1, startTime: 1 }); // Sort by date and time ascending

    // Format the response
    const formattedAppointments = appointments.map(appointment => ({
      ...appointment.toObject(),
      hcmDetails: appointment.hcmId,
      tenantDetails: appointment.tenantId
    }));

    res.status(200).json({
      success: true,
      message: "Appointments fetched successfully",
      response: formattedAppointments
    });

  } catch (error) {
    console.error('Error in getAppointments:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching appointments"
    });
  }
};

const uploadDocument = async (req, res) => {
  try {
    const file = req.file;
    const { hcmId, folderName } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Validate hcmId format
    if (!mongoose.Types.ObjectId.isValid(hcmId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid HCM ID format"
      });
    }

    // Check if HCM exists
    const hcm = await users.findById(hcmId);
    if (!hcm) {
      return res.status(404).json({
        success: false,
        message: "HCM not found"
      });
    }

    // Convert the file buffer to base64
    const fileStr = file.buffer.toString('base64');
    const fileType = file.mimetype;

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(
      `data:${fileType};base64,${fileStr}`,
      {
        folder: 'hcm-documents', // Different folder for HCM documents
        resource_type: 'auto', // Automatically detect file type
      }
    );

    // Save document reference in database
    const newDocument = new Document({
      hcmId,
      folderName,
      fileName: file.originalname,
      filePath: uploadResponse.secure_url,
      originalName: file.originalname,
      mimeType: file.mimetype,
      cloudinaryId: uploadResponse.public_id,
      year: new Date().getFullYear().toString(),
      reviewComplete: false
    });

    const savedDocument = await newDocument.save();

    return res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      response: {
        _id: savedDocument._id,
        fileName: savedDocument.fileName,
        filePath: savedDocument.filePath,
        folderName: savedDocument.folderName
      }
    });

  } catch (error) {
    console.error('Error in uploadDocument:', error);
    return res.status(500).json({
      success: false,
      message: 'Error uploading document',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Upload failed'
    });
  }
};

// Fetch documents
const fetchDocuments = async (req, res) => {
  try {
    const { hcmId } = req.body;

    if (!hcmId) {
      return res.status(400).json({
        success: false,
        message: "HCM ID is required"
      });
    }

    // Validate hcmId format
    if (!mongoose.Types.ObjectId.isValid(hcmId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid HCM ID format"
      });
    }

    // Check if HCM exists
    const hcm = await users.findById(hcmId);
    if (!hcm) {
      return res.status(404).json({
        success: false,
        message: "HCM not found"
      });
    }

    // Find all documents for this HCM with populated HCM details
    const documents = await Document.find({ hcmId })
      .populate({
        path: 'hcmId',
        select: 'name email phoneNo',
        model: 'users'
      })
      .sort({ createdAt: -1 }); // Sort by newest first

    // Format the response
    const formattedDocuments = documents.map(doc => ({
      ...doc.toObject(),
      hcmDetails: doc.hcmId
    }));

    res.status(200).json({
      success: true,
      message: "Documents fetched successfully",
      documents: formattedDocuments
    });

  } catch (error) {
    console.error('Error in fetchDocuments:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching documents"
    });
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId, status, approved } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID is required"
      });
    }

    const updatedAppointment = await HcmAppointments.findByIdAndUpdate(
      appointmentId,
      {
        status: status,
        approved: approved
      },
      { new: true }
    );

    if (!updatedAppointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Appointment status updated successfully",
      response: updatedAppointment
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Error updating appointment status"
    });
  }
};

// Add a new controller to update service status
const updateServiceStatus = async (req, res) => {
  try {
    const { serviceId, status, reviewStatus } = req.body;

    // Validate serviceId presence
    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Service ID is required'
      });
    }

    // Validate serviceId format
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID format'
      });
    }

    // Validate at least one status is being updated
    if (!status && !reviewStatus) {
      return res.status(400).json({
        success: false,
        message: 'Either status or reviewStatus must be provided'
      });
    }

    // Validate status values if provided
    if (status && !['pending', 'active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    // Validate reviewStatus values if provided
    if (reviewStatus && !['pending', 'approved', 'rejected'].includes(reviewStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reviewStatus value'
      });
    }

    const service = await HcmService.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    if (status) service.status = status;
    if (reviewStatus) service.reviewStatus = reviewStatus;

    const updatedService = await service.save();

    res.status(200).json({
      success: true,
      message: 'Service status updated successfully',
      response: updatedService
    });

  } catch (error) {
    console.error('Error in updateServiceStatus:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating service status'
    });
  }
};

const getAllHcms = async (req, res) => {
  try {
    // Find all users with role 1 (HCMs) and select only _id and name fields
    const hcms = await users.find({ role: 1 })
      .select('_id name')
      .lean();

    return res.status(200).json({
      success: true,
      message: "HCMs fetched successfully",
      response: hcms
    });
  } catch (error) {
    console.error('Error in getAllHcms:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching HCMs'
    });
  }
};
const getAssignedTenantsToHcm = async (req, res) => {
  const { hcmId } = req.body;

  try {
    // Validate hcmId
    if (!hcmId) {
      return res.status(400).json({ success: false, message: 'HCM ID is required.' });
    }

    // Validate hcmId format
    if (!mongoose.Types.ObjectId.isValid(hcmId)) {
      return res.status(400).json({ success: false, message: 'Invalid HCM ID format.' });
    }

    // Find the assignment for the given hcmId and populate complete tenant details
    const assignment = await tenantAssignedtoHcm.findOne({ hcmId })
      .populate({
        path: 'tenantIds',
        model: 'causers' // Fetch all fields for each user
      });

    if (!assignment) {
      return res.status(300).json({ success: false, message: 'No tenants assigned to this HCM.' });
    }

    // Return the complete user details
    return res.status(200).json({
      success: true,
      message: "Tenants assigned to HCM fetched successfully",
      response: assignment.tenantIds
    });
  } catch (error) {
    console.error('Error fetching assigned tenants:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching assigned tenants.',
      error: error.message || error
    });
  }
};


const assignTenantsToHcm = async (req, res) => {
  try {
    const { hcmId, tenantIds } = req.body;

    // Validate required fields
    if (!hcmId || !tenantIds || !Array.isArray(tenantIds)) {
      return res.status(400).json({
        success: false,
        message: "HCM ID and an array of Tenant IDs are required"
      });
    }

    // Validate HCM ID
    if (!mongoose.Types.ObjectId.isValid(hcmId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid HCM ID format"
      });
    }

    // Validate each Tenant ID
    for (const tenantId of tenantIds) {
      if (!mongoose.Types.ObjectId.isValid(tenantId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid Tenant ID format: ${tenantId}`
        });
      }
    }

    // Check if assignment already exists
    let assignment = await tenantAssignedtoHcm.findOne({ hcmId });
    if (assignment) {
      // Add new tenant IDs to the existing assignment
      tenantIds.forEach(tenantId => {
        if (!assignment.tenantIds.includes(tenantId)) {
          assignment.tenantIds.push(tenantId);
        }
      });
      await assignment.save();
    } else {
      // Create new assignment
      assignment = new tenantAssignedtoHcm({
        hcmId,
        tenantIds
      });
      await assignment.save();
    }

    return res.status(200).json({
      success: true,
      message: "Tenants assigned to HCM successfully",
      response: assignment
    });
  } catch (error) {
    console.error('Error in assignTenantsToHcm:', error);
    return res.status(500).json({
      success: false,
      message: "Error processing tenant assignment",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export {
  createHcm,
  getHcm,
  getHcms,
  assignServicesAndDocuments,
  getServicesAndDocuments,
  updateServiceStatus,
  createSchedule,
  getAppointments,
  uploadDocument,
  fetchDocuments,
  updateAppointmentStatus,
  getAllHcms,
  getAssignedTenantsToHcm,
  getHcmInfo,
  assignTenantsToHcm,
  updateHcm,
  deleteHcm,
  getHcmChartInfo
};