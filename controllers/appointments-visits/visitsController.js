import Visits from "../../models/appointments-visits/visits.js";
import users from "../../models/account/users.js";
import ServiceTracking from "../../models/bills/serviceTracking.js";
import info from "../../models/hcm-tenants/tenantInfo.js";
import approvedvisits from "../../models/appointments-visits/approvedVisits.js";
import Bill from "../../models/bills/bills.js";
import TenantInfo from "../../models/hcm-tenants/tenantInfo.js";
import billsPending from "../../models/bills/billsPending.js";
import mongoose from "mongoose";

export const fetchVisits = async (req, res) => {
  try {
    const { companyId } = req.params;
    const visits = await Visits.find({ companyId })
      .populate({
        path: "creatorId",
        select: "name email role",
        model: "users",
      })
      .populate({
        path: "hcmId",
        select: "name email phoneNo",
        model: "users",
      })
      .populate({
        path: "tenantId",
        select: "name email phoneNo",
        model: "users",
      })
      .sort({ dateOfService: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      message: "All visits fetched successfully",
      response: visits,
    });
  } catch (error) {
    console.error("Error in fetchVisits:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createVisit = async (req, res) => {
  try {
    const {
      creatorId,
      hcmId,
      tenantId,
      date,
      startTime,
      endTime,
      activity,
      methodOfContact,
      reasonForRemote,
      place,
      serviceType,
      approved,
      totalMiles,
      travelWithTenant,
      travelWithoutTenant,
      signature,
      response,
      status,
      travel,
      notes,
      reasonForRejection,
      companyId,
    } = req.body;

    // Fetch the creator's role
    const creator = await users.findById(creatorId);
    if (!creator) {
      return res
        .status(303)
        .json({ success: false, message: "Creator not found" });
    }

    let visitStatus = "pending";
    if (creator.role === 2) {
      visitStatus = "approved"; // Office admin
    } else if (creator.role === 0) {
      return res
        .status(303)
        .json({ success: false, message: "Tenants cannot create visits" });
    }

    // Parse startTime and endTime as Date objects
    const visitStartTime = new Date(startTime);
    const visitEndTime = new Date(endTime);

    // Ensure startTime is before endTime
    if (visitStartTime >= visitEndTime) {
      return res.status(400).json({
        success: false,
        message: "Start time must be before end time.",
        response: null,
      });
    }

    // Create the visit
    const newVisit = new Visits({
      creatorId: new mongoose.Types.ObjectId(creatorId),
      hcmId: new mongoose.Types.ObjectId(hcmId),
      tenantId: new mongoose.Types.ObjectId(tenantId),
      date,
      startTime: visitStartTime,
      endTime: visitEndTime,
      activity,
      methodOfContact,
      reasonForRemote,
      place,
      serviceType,
      totalMiles,
      travelWithTenant,
      travelWithoutTenant,
      signature,
      response,
      status: visitStatus,
      travel,
      notes,
      reasonForRejection,
      companyId,
    });

    await newVisit.save();

    // Calculate units used for the visit
    const durationInMinutes = (visitEndTime - visitStartTime) / 60000;
    let unitsUsed = durationInMinutes / 15; // 15 minutes = 1 unit
    unitsUsed = parseFloat(unitsUsed.toFixed(2)); // Round to two decimal places

    let serviceRecord;
    // Update the service tracking record
    const serviceTracking = await ServiceTracking.findOne({
      tenantId: newVisit.tenantId,
      serviceType: newVisit.serviceType,
      companyId,
    });

    if (serviceTracking) {
      serviceTracking.workedUnits =
        (serviceTracking.workedUnits || 0) + unitsUsed;
      serviceTracking.unitsRemaining -= unitsUsed;
      serviceTracking.scheduledUnits = Math.max(
        0,
        serviceTracking.scheduledUnits - unitsUsed
      );
      // Add hcmId to hcmIds array if not already present
      if (
        !serviceTracking.hcmIds.some(
          (hcm) => hcm.hcmId && hcm.hcmId.toString() === newVisit.hcmId
        )
      ) {
        serviceTracking.hcmIds.push({
          hcmId: newVisit.hcmId,
          serviceDetails: [
            { dateOfService: newVisit.date, workedUnits: unitsUsed },
          ],
        });
      } else {
        serviceTracking.hcmIds
          .find((hcm) => hcm.hcmId && hcm.hcmId.toString() === newVisit.hcmId)
          .serviceDetails.find(
            (service) => service.dateOfService === newVisit.date
          ).workedUnits += unitsUsed;
      }
      serviceRecord = await serviceTracking.save();
    }

    res.status(200).json({
      success: true,
      message: "Visit created successfully",
      response: {
        "New Visit": newVisit,
        "Service Record": serviceRecord,
      },
    });
  } catch (error) {
    console.error("Error in createVisit:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const getVisits = async (req, res) => {
  const { companyId } = req.params;
  try {
    const visits = await Visits.find({ companyId })
      .populate({
        path: "creatorId",
        select: "name email role",
        model: "causers",
      })
      .populate({
        path: "hcmId",
        select: "name email phoneNo",
        model: "causers",
      })
      .populate({
        path: "tenantId",
        select: "name email phoneNo",
        model: "causers",
      });

    res.status(200).json({
      success: true,
      message: "Visits fetched successfully",
      response: {
        visits: visits,
      },
    });
  } catch (error) {
    console.error("Error in getVisits:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const updateVisit = async (req, res) => {
  const { id } = req.params;
  const { updateData, companyId } = req.body;
  try {
    const visit = await Visits.findById(id);
    if (!visit) {
      return res
        .status(400)
        .json({ success: false, message: "Visit not found" });
    }
    const updatedVisitData = {
      creatorId: updateData?.creatorId || visit.creatorId,
      hcmId: updateData?.hcmId || visit.hcmId,
      tenantId: updateData?.tenantId || visit.tenantId,
      date: updateData?.date || visit.date,
      startTime: updateData?.startTime || visit.startTime,
      endTime: updateData?.endTime || visit.endTime,
      activity: updateData?.activity || visit.activity,
      methodOfContact: updateData?.methodOfContact || visit.methodOfContact,
      reasonForRemote: updateData?.reasonForRemote || visit.reasonForRemote,
      place: updateData?.place || visit.place,
      serviceType: updateData?.serviceType || visit.serviceType,
      totalMiles: updateData?.totalMiles || visit.totalMiles,
      travelWithTenant: updateData?.travelWithTenant || visit.travelWithTenant,
      travelWithoutTenant:
        updateData?.travelWithoutTenant || visit.travelWithoutTenant,
      signature: updateData?.signature || visit.signature,
      response: updateData?.response || visit.response,
      status: updateData?.status || visit.status,
      travel: updateData?.travel || visit.travel,
      notes: updateData?.notes || visit.notes,
      reasonForRejection:
        updateData?.reasonForRejection || visit.reasonForRejection,
      companyId: updateData?.companyId || companyId,
    };
    const updatedVisit = await Visits.findByIdAndUpdate(id, updatedVisitData, {
      new: true,
    });

    const serviceTracking = await ServiceTracking.findOne({
      tenantId: updatedVisit.tenantId,
      serviceType: updatedVisit.serviceType,
      companyId,
    });
    let serviceRecord;
    if (serviceTracking) {
      const durationInMinutes =
        (updatedVisit.endTime - updatedVisit.startTime) / 60000;
      let unitsUsed = durationInMinutes / 15; // 15 minutes = 1 unit
      unitsUsed = parseFloat(unitsUsed.toFixed(2)); // Round to two decimal places

      if (unitsUsed > serviceTracking.unitsRemaining) {
        return res.status(400).json({
          success: false,
          message: "Units remaining is less than the units used",
        });
      }
      serviceTracking.workedUnits =
        (serviceTracking.workedUnits || 0) + unitsUsed;
      serviceTracking.unitsRemaining -= unitsUsed;
      serviceTracking.scheduledUnits = Math.max(
        0,
        serviceTracking.scheduledUnits - unitsUsed
      );
      const hcms = serviceTracking.hcmIds.find(
        (hcm) => hcm.hcmId && hcm.hcmId.toString() === updatedVisit.hcmId
      );
      if (hcms) {
        hcms.serviceDetails.find(
          (service) => service.dateOfService === updatedVisit.date
        ).workedUnits += unitsUsed;
      }
      serviceRecord = await serviceTracking.save();
    }

    return res.status(200).json({
      success: true,
      message: "Visit updated successfully",
      response: {
        "Updated Visit": updatedVisit,
        "Updated Service Record": serviceRecord,
      },
    });
  } catch (error) {
    console.error("Error in updateVisits:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteVisit = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedVisit = await Visits.findByIdAndDelete(id);
    if (!deletedVisit) {
      return res
        .status(400)
        .json({ success: false, message: "Visit not found" });
    }

    res.status(200).json({
      success: true,
      message: "Visit deleted successfully",
      response: {
        deletedVisit: deletedVisit,
      },
    });
  } catch (error) {
    console.error("Error in deleteVisit:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const visitsWaitingForApproval = async (req, res) => {
  const { companyId } = req.params;
  try {
    const visits = await Visits.find({ status: "pending", companyId });
    res.status(200).json({
      success: true,
      message: "Visits waiting for approval fetched successfully",
      response: {
        visits: visits,
        count: visits.length,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getVisitsCompliance = async (req, res) => {
  const { companyId } = req.params;
  try {
    const visits = await Visits.find({ companyId })
      .populate({
        path: "tenantId",
        select: "_id name email",
        model: "causers",
      })
      .populate({
        path: "hcmId",
        select: "_id name email",
        model: "causers",
      });

    const visitCounts = {};
    const visitDetails = {
      "in-person": {},
      indirect: {},
      remote: {},
    };

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    visits.forEach((visit) => {
      const visitDate = new Date(visit.date);
      if (isNaN(visitDate)) {
        console.error(`Invalid date for visit ID: ${visit._id}`);
        return;
      }

      const year = visitDate.getFullYear();
      const month = monthNames[visitDate.getMonth()];

      if (!visitCounts[year]) {
        visitCounts[year] = {};
      }
      if (!visitCounts[year][month]) {
        visitCounts[year][month] = { "in-person": 0, indirect: 0, remote: 0 };
      }

      if (!visitDetails["in-person"][year]) {
        visitDetails["in-person"][year] = {};
      }
      if (!visitDetails["indirect"][year]) {
        visitDetails["indirect"][year] = {};
      }
      if (!visitDetails["remote"][year]) {
        visitDetails["remote"][year] = {};
      }

      if (!visitDetails["in-person"][year][month]) {
        visitDetails["in-person"][year][month] = [];
      }
      if (!visitDetails["indirect"][year][month]) {
        visitDetails["indirect"][year][month] = [];
      }
      if (!visitDetails["remote"][year][month]) {
        visitDetails["remote"][year][month] = [];
      }

      const method = visit.methodOfContact || "unknown";
      switch (method) {
        case "in-person":
          visitCounts[year][month]["in-person"]++;
          visitDetails["in-person"][year][month].push(createVisitDetail(visit));
          break;
        case "indirect":
          visitCounts[year][month]["indirect"]++;
          visitDetails["indirect"][year][month].push(createVisitDetail(visit));
          break;
        case "remote":
          visitCounts[year][month]["remote"]++;
          visitDetails["remote"][year][month].push(createVisitDetail(visit));
          break;
        default:
          console.warn(`Unknown methodOfContact for visit ID: ${visit._id}`);
          break;
      }
    });

    res.status(200).json({
      success: true,
      message: "Visit compliance fetched successfully",
      response: {
        visitCounts,
        visitDetails,
        totalVisits: visits.length,
      },
    });
  } catch (error) {
    console.error("Error fetching visit data:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching visit compliance data.",
    });
  }
};

function createVisitDetail(visit) {
  return {
    visitId: visit._id,
    tenant: {
      tenantId: visit.tenantId ? visit.tenantId._id : "Unknown Tenant ID",
      tenantName: visit.tenantId ? visit.tenantId.name : "Unknown Tenant",
      tenantEmail: visit.tenantId ? visit.tenantId.email : "Unknown Email",
    },
    hcm: {
      hcmId: visit.hcmId ? visit.hcmId._id : "Unknown HCM ID",
      hcmName: visit.hcmId ? visit.hcmId.name : "Unknown HCM",
      hcmEmail: visit.hcmId ? visit.hcmId.email : "Unknown Email",
    },
    serviceType: visit.serviceType,
    dateOfService: visit.date.toISOString().split("T")[0],
    methodOfVisit: visit.methodOfContact || "N/A",
  };
}

export const markVisitAsApproved = async (req, res) => {
  const { companyId } = req.params;
  try {
    const { visitId } = req.body;
    const visitDocumentId = new mongoose.Types.ObjectId(visitId);
    const visit = await Visits.findById(visitDocumentId);

    if (!visit) {
      return res
        .status(400)
        .json({ success: false, message: "Visit not found" });
    }

    // Update the visit status, signature, and time of approval
    visit.status = "approved";
    visit.signature = "done";
    visit.timeOfApproval = new Date(); // Set the current date and time

    await visit.save();

    // Use startTime and endTime as Date objects directly
    const startTime = new Date(visit.startTime);
    const endTime = new Date(visit.endTime);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid start or end time" });
    }

    const newVisitApproved = new approvedvisits({
      visit: visitDocumentId,
    });
    await newVisitApproved.save();

    // Fetch tenant details using tenantInfoModel
    const user = await users.findById(
      new mongoose.Types.ObjectId(visit.tenantId)
    );

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Tenant not found" });
    }

    const tenantInfo = await TenantInfo.findById(user.info_id);
    if (!tenantInfo) {
      return res
        .status(400)
        .json({ success: false, message: "Tenant information not found" });
    }

    const service = await ServiceTracking.findOne({
      tenantId: visit.tenantId,
      serviceType: visit.serviceType,
      companyId,
    });
    // if (!service) {
    //   return res
    //     .status(400)
    //     .json({ success: false, message: 'Service tracking record not found' });
    // }
    // Create a new bill
    const newBill = new Bill({
      tenant: visit.tenantId,
      serviceType: visit.serviceType,
      interchangeControlHeader: {
        senderId: tenantInfo.personalInfo.maPMINumber,
      },
      functionalGroupHeader: {
        senderCode: tenantInfo.personalInfo.maPMINumber,
      },
      submitterName: {
        name: tenantInfo.admissionInfo.insurance,
        identifier: tenantInfo.personalInfo.maPMINumber,
        contactName: `${tenantInfo.personalInfo.firstName} ${tenantInfo.personalInfo.middleName} ${tenantInfo.personalInfo.lastName}`,
        communicationNumber: tenantInfo.contactInfo.phoneNumber,
      },
      billingProvider: {
        taxonomyCode: tenantInfo.admissionInfo.ssn,
        name: tenantInfo.admissionInfo.insurance,
        identifier: tenantInfo.personalInfo.maPMINumber,
        address: {
          line1: tenantInfo.address.addressLine1,
          line2: tenantInfo.address.addressLine2,
          city: tenantInfo.address.city,
          state: tenantInfo.address.state,
          zipCode: tenantInfo.address.zipCode,
        },
        additionalIdentifier: tenantInfo.admissionInfo.ssn,
      },
      receiverName: {
        name: "Anand",
      },
      subscriber: {
        lastName: tenantInfo.personalInfo.lastName,
        firstName: tenantInfo.personalInfo.firstName,
        primaryIdentifier: tenantInfo.personalInfo.maPMINumber,
        address: {
          line1: tenantInfo.address.addressLine1,
          line2: tenantInfo.address.addressLine2,
          city: tenantInfo.address.city,
          state: tenantInfo.address.state,
          zipCode: tenantInfo.address.zipCode,
        },
        gender: tenantInfo.personalInfo.gender,
      },
      payerName: {
        name: tenantInfo.admissionInfo.insurance,
        identifier: tenantInfo.personalInfo.maPMINumber,
        secondaryIdentifier: tenantInfo.admissionInfo.ssn,
      },
      claimInformation: {
        patientAccountNumber: tenantInfo.admissionInfo.ssn,
        totalClaimChargeAmount: 12 * 100, // Example calculation
        medicalRecordNumber: tenantInfo.admissionInfo.ssn,
        diagnosisCode: tenantInfo.admissionInfo.diagnosisCode,
      },
      renderingProvider: {
        name: tenantInfo.admissionInfo.insurance,
        identifier: tenantInfo.personalInfo.maPMINumber,
        secondaryIdentifier: tenantInfo.admissionInfo.ssn,
      },
      serviceLine: [
        {
          procedureCode: tenantInfo.admissionInfo.diagnosisCode,
          lineItemChargeAmount: 12 * 17.17, // Example calculation
          serviceUnitCount: 12,
          serviceDate: visit.date,
        },
      ],
      visit: visit._id,
      companyId,
    });
    await newBill.save();

    // Add to BillingPending
    const newBillingPending = new billsPending({
      bill: newBill._id,
      tenant: visit.tenantId,
      companyId,
    });
    await newBillingPending.save();

    const response = {
      success: true,
      message: "Visit approved successfully",
      visit: {
        visit: visit,
        bill: newBill,
        billingPending: newBillingPending,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error marking visit as completed:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      response: error.message,
    });
  }
};

export const getVisitsComplianceReports = async (req, res) => {
  const { companyId } = req.params;
  try {
    // Fetch all visit records
    const visits = await Visits.find({ companyId })
      .populate({
        path: "tenantId",
        select: "_id name email phoneNo",
        model: "causers",
      })
      .populate({
        path: "hcmId",
        select: "_id name email phoneNo",
        model: "causers",
      });

    // Format the response
    const formattedReports = visits.map((visit) => {
      const durationInMinutes =
        (new Date(visit.endTime) - new Date(visit.startTime)) / 60000;
      const duration = `${Math.floor(durationInMinutes / 60)}h ${
        durationInMinutes % 60
      }m`;

      return {
        tenantId: visit.tenantId ? visit.tenantId._id : "Unknown Tenant ID",
        tenantName: visit.tenantId ? visit.tenantId.name : "Unknown Tenant",
        hcmId: visit.hcmId ? visit.hcmId._id : "Unknown HCM ID",
        assignedHCM: visit.hcmId ? visit.hcmId.name : "Unknown HCM",
        serviceType: visit.serviceType,
        dateOfService: visit.date.toISOString().split("T")[0],
        duration: duration,
        visitType: visit.activity || "N/A",
        methodOfVisit: visit.methodOfContact || "N/A",
        mileage: visit.totalMiles || 0,
      };
    });

    res.status(200).json({
      success: true,
      message: "Visits compliance reports fetched successfully",
      response: {
        totalVisits: visits.length,
        visits: formattedReports,
      },
    });
  } catch (error) {
    console.error("Error fetching visits compliance reports:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const filterVisits = async (req, res) => {
  try {
    const { companyId } = req.params;
    const filterCriteria = req.body;

    // Initialize base query with companyId
    const query = { companyId };

    // If filter criteria provided, add additional filters
    if (filterCriteria && Object.keys(filterCriteria).length > 0) {
      if (filterCriteria._id) {
        query._id = filterCriteria._id;
      }
      if (filterCriteria.tenantId) {
        query.tenantId = filterCriteria.tenantId;
      }
      if (filterCriteria.hcmId) {
        query.hcmId = filterCriteria.hcmId;
      }
      if (filterCriteria.creatorId) {
        query.creatorId = filterCriteria.creatorId;
      }
      if (filterCriteria.serviceType) {
        query.serviceType = filterCriteria.serviceType;
      }
      if (filterCriteria.title) {
        query.title = filterCriteria.title;
      }
      if (filterCriteria.date) {
        query.date = new Date(filterCriteria.date);
      }
      if (filterCriteria.startDate && filterCriteria.endDate) {
        const start = new Date(filterCriteria.startDate);
        const end = new Date(filterCriteria.endDate);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          query.date = { $gte: start, $lte: end };
        }
      }
      if (filterCriteria.startTime) {
        query.startTime = filterCriteria.startTime;
      }
      if (filterCriteria.endTime) {
        query.endTime = filterCriteria.endTime;
      }
      if (filterCriteria.place) {
        query.place = filterCriteria.place;
      }
      if (filterCriteria.methodOfVisit) {
        query.methodOfVisit = filterCriteria.methodOfVisit;
      }
      if (filterCriteria.reasonForRemote) {
        query.reasonForRemote = filterCriteria.reasonForRemote;
      }
      if (filterCriteria.notes) {
        query.notes = filterCriteria.notes;
      }
      if (filterCriteria.travel) {
        query.travel = filterCriteria.travel;
      }
      if (filterCriteria.totalMiles !== undefined) {
        query.totalMiles = filterCriteria.totalMiles;
      }
      if (filterCriteria.travelWithTenant !== undefined) {
        query.travelWithTenant = filterCriteria.travelWithTenant;
      }
      if (filterCriteria.travelWithoutTenant !== undefined) {
        query.travelWithoutTenant = filterCriteria.travelWithoutTenant;
      }
      if (filterCriteria.signature) {
        query.signature = filterCriteria.signature;
      }
      if (filterCriteria.status) {
        query.status = filterCriteria.status;
      }
    }

    const visits = await Visits.find(query)
      .populate({
        path: "creatorId",
        select: "name email role",
        model: "causers",
      })
      .populate({
        path: "hcmId",
        select: "name email phoneNo",
        model: "causers",
      })
      .populate({
        path: "tenantId",
        select: "name email phoneNo",
        model: "causers",
      })
      .sort({ dateOfService: 1, startTime: 1 });

    if (visits.length === 0) {
      return res.status(200).json({
        success: false,
        message:
          "No visits found for this company with the specified criteria.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Visits fetched successfully",
      response: visits,
    });
  } catch (error) {
    console.error("Error in filterVisits:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
