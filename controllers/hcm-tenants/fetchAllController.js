import mongoose from 'mongoose';
import users from '../../models/account/users.js';
import hcmInfo from '../../models/hcm-tenants/hcmInfo.js';
import tenantInfo from '../../models/hcm-tenants/tenantInfo.js';
import ServiceTracking from '../../models/bills/serviceTracking.js';

export const getAllHCMsTenants = async (req, res) => {
  const companyId = req.query.companyId;
  try {

    // Convert companyId to ObjectId using 'new'
    const companyIdObject = new mongoose.Types.ObjectId(companyId);

    // Find users with the specified companyId
    const allData = await users.find({ companyId: companyIdObject });
    console.log('Found users:', allData);

    const formattedData = {
      hcm: [],
      tenants: [],
      tenantCities: new Set(),
      tenantInsurance: new Set(),
      hcmCities: new Set()
    };

    for (const user of allData) {
      const { password, role, info_id, ...userData } = user._doc; // Exclude password and role

      let additionalData = null;

      if (role === 1) {
        // Fetch HCM details from the hcmInfo model using the `info_id`
        additionalData = await hcmInfo.findById(info_id).lean();

        // Collect HCM city info
        if (additionalData) {
          formattedData.hcmCities.add(additionalData.addressInfo.city);
        }

        formattedData.hcm.push({
          ...userData,
          hcmData: additionalData
        });
      } else if (role === 0) {
        // Fetch tenant details from the info model using the `info_id`
        additionalData = await tenantInfo.findById(info_id).lean();

        // Fetch service tracking data for the tenant
        const serviceTrackingData = await ServiceTracking.find({ tenantId: user._id }).lean();

        // Collect tenant city and insurance info
        if (additionalData) {
          formattedData.tenantCities.add(additionalData.address.city);
          formattedData.tenantInsurance.add(additionalData.admissionInfo.insurance);
        }

        formattedData.tenants.push({
          ...userData,
          tenantData: additionalData,
          servicesInfo: {
            tags: serviceTrackingData.map(data => data.serviceType), // Example of tags
            details: serviceTrackingData // Detailed documents
          }
        });
      }
    }

    // Convert sets to arrays for the response
    formattedData.tenantCities = Array.from(formattedData.tenantCities);
    formattedData.tenantInsurance = Array.from(formattedData.tenantInsurance);
    formattedData.hcmCities = Array.from(formattedData.hcmCities);

    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error fetching HCMs and tenants:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
