import ServiceTracking from '../../models/bills/serviceTracking.js';
import users from '../../models/account/users.js';
import tenantInfo from '../../models/hcm-tenants/tenantInfo.js';
import Visits from '../../models/appointments-visits/visits.js';
import hcmInfo from '../../models/hcm-tenants/hcmInfo.js';

//tenant reports
const getTenantPersonalInfoReports = async (req, res) => {
  const { companyId } = req.params;
  try {
    // Find all users with role 0 (tenants)
    const tenants = await users
      .find({ role: 0, companyId })
      .select('_id info_id')
      .lean();

    // Initialize an array to hold the tenant details
    const tenantDetails = [];

    // Fetch tenant info for each tenant
    for (const tenant of tenants) {
      const info = await tenantInfo
        .findById(tenant.info_id)
        .select(
          'personalInfo.firstName personalInfo.lastName personalInfo.maPMINumber address.city address.state address.zipCode designate'
        )
        .lean();

      if (info) {
        tenantDetails.push({
          userId: tenant._id,
          firstName: info.personalInfo.firstName,
          lastName: info.personalInfo.lastName,
          pmi: info.personalInfo.maPMINumber,
          address: info.address.addressLine1,
          city: info.address.city,
          state: info.address.state,
          zip: info.address.zipCode,
          insurance: info.insurance,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Tenant details fetched successfully',
      response: tenantDetails,
    });
  } catch (error) {
    console.error('Error fetching tenant details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tenant details',
      error: error.message || error,
    });
  }
};

const getServiceTrackingPlanReports = async (req, res) => {
  const { companyId } = req.params;
  try {
    // Fetch all service tracking records
    const serviceTrackingReports = await ServiceTracking.find({ companyId })
      .populate({
        path: 'tenantId',
        select: '_id name',
        model: 'causers',
      })
      .populate({
        path: 'hcmIds.hcmId',
        select: '_id name',
        model: 'causers',
      });

    // Format the response
    const formattedReports = serviceTrackingReports.map((report) => ({
      tenantId: report.tenantId ? report.tenantId._id : '',
      tenantName: report.tenantName ? report.tenantId.name : '',
      assignedHCMs: report.hcmIds.map((hcm) => ({
        hcmId: hcm.hcmId ? hcm.hcmId._id : '',
        hcmName: hcm.hcmId ? hcm.hcmId.name : '',
        workedHours: hcm.workedHours,
        workedUnits: hcm.workedUnits,
        serviceDetails: hcm.serviceDetails.map((detail) => ({
          dateOfService: detail.dateOfService,
          scheduledUnits: detail.scheduledUnits,
          workedUnits: detail.workedUnits,
          methodOfContact: detail.methodOfContact,
          placeOfService: detail.placeOfService,
        })),
      })),
      serviceType: report.serviceType,
      dateRange: `${report.startDate.toISOString().split('T')[0]} to ${
        report.endDate.toISOString().split('T')[0]
      }`,
      scheduledUnits: report.scheduledUnits,
      workedUnits: report.workedUnits,
      remainingUnits: report.unitsRemaining,
    }));

    res.status(200).json({
      success: true,
      message: 'Service tracking reports fetched successfully',
      response: formattedReports,
    });
  } catch (error) {
    console.error('Error fetching service tracking reports:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getTenantVisitComplianceReports = async (req, res) => {
  const { companyId } = req.params;
  try {
    const visits = await Visits.find({ companyId })
      .populate({
        path: 'tenantId',
        select: '_id name email',
        model: 'causers',
      })
      .populate({
        path: 'hcmId',
        select: '_id name email',
        model: 'causers',
      });

    const formattedReports = visits.map((visit) => {
      const durationInMinutes =
        (new Date(visit.endTime) - new Date(visit.startTime)) / 60000;
      const duration = `${Math.floor(durationInMinutes / 60)}h ${
        durationInMinutes % 60
      }m`;

      return {
        tenantName: visit.tenantId ? visit.tenantId.name : 'Unknown Tenant',
        assignedHCM: visit.hcmId ? visit.hcmId.name : 'Unknown HCM',
        serviceType: visit.serviceType,
        dateOfService: visit.date.toISOString().split('T')[0],
        duration: duration,
        visitType: visit.activity || 'N/A',
        methodOfVisit: visit.methodOfContact || 'N/A',
        mileage: visit.totalMiles || 0,
      };
    });

    res.status(200).json({
      success: true,
      message: 'Tenant visit compliance reports fetched successfully',
      response: formattedReports,
    });
  } catch (error) {
    console.error('Error fetching tenant visit compliance reports:', error);
    res.status(500).json({
      success: false,
      message:
        'An error occurred while fetching tenant visit compliance reports.',
    });
  }
};

//hcm reports
const getHcmPersonalInfoReports = async (req, res) => {
  const { companyId } = req.params;
  try {
    // Find all users with role 1 (HCMs)
    const hcms = await users
      .find({ role: 1, companyId })
      .select('_id info_id')
      .lean();

    // Initialize an array to hold the HCM details
    const hcmDetails = [];

    // Fetch HCM info for each HCM
    for (const hcm of hcms) {
      const info = await hcmInfo
        .findById(hcm.info_id)
        .select(
          'personalInfo.firstName personalInfo.lastName contactInfo.email addressInfo.addressLine1 addressInfo.city addressInfo.state addressInfo.zipCode employmentInfo.hireDate loginInfo.username'
        )
        .lean();
      if (info) {
        hcmDetails.push({
          userId: hcm._id,
          firstName: info.personalInfo.firstName,
          lastName: info.personalInfo.lastName,
          address: info.addressInfo.addressLine1,
          city: info.addressInfo.city,
          state: info.addressInfo.state,
          zip: info.addressInfo.zipCode,
          hireDate: info.employmentInfo.hireDate,
          username: info.loginInfo.username,
          email: info.contactInfo.email,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'HCM personal info reports fetched successfully',
      response: hcmDetails,
    });
  } catch (error) {
    console.error('Error fetching HCM personal info reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching HCM personal info reports',
      error: error.message || error,
    });
  }
};

const numberOfTenantsHcms = async (req, res) => {
  try {
    const { companyId } = req.body;
    const tenants = await users.find({ companyId, role: 0 });
    const hcms = await users.find({ companyId, role: 1 });
    res.status(200).json({
      success: true,
      message: 'Number of tenants and HCMs fetched successfully',
      response: { tenants, hcms },
    });
  } catch (error) {
    console.error('Error fetching number of tenants and HCMs:', error);
    res
      .status(500)
      .json({ success: false, message: 'Server error', error: error.message });
  }
};

export {
  getTenantPersonalInfoReports,
  getServiceTrackingPlanReports,
  getTenantVisitComplianceReports,
  getHcmPersonalInfoReports,
  numberOfTenantsHcms,
};
