import serviceTracking from '../../models/bills/serviceTracking.js';
import billingPending from '../../models/bills/billsPending.js';
import billingDone from '../../models/bills/billsDone.js';
import Bill from '../../models/bills/bills.js';
import users from '../../models/account/users.js';
import hcmInfo from '../../models/hcm-tenants/hcmInfo.js';
export const getTenantsRunningByUnits = async (req, res) => {
  const { companyId } = req.params;
  try {
    const count = await serviceTracking.countDocuments({ unitsRemaining: { $lte: 50 }, companyId });
    res.status(200).json({
      success: true, message: "Tenants running by units fetched successfully", response: {
        count
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
export const planUsage = async (req, res) => {
  try {
    const { tenantId } = req.body;
    // Fetch all service tracking records for the given tenant ID
    const serviceTrackings = await serviceTracking.find({ tenantId })
      .populate({
        path: 'tenantId',
        select: '_id name',
        model: 'causers'
      })
      .populate({
        path: 'hcmIds.hcmId',
        select: '_id name info_id',
        model: 'causers'
      });

    if (serviceTrackings.length === 0) {
      return res.status(400).json({ success: false, message: "Service tracking data not found for the given tenant ID" });
    }

    const response = await Promise.all(serviceTrackings.map(async serviceTracking => {
      const assignedHCMs = await Promise.all(serviceTracking.hcmIds.map(async hcm => {
        const hcmInfoRecord = await hcmInfo.findById(hcm.hcmId.info_id).select('personalInfo.firstName personalInfo.lastName contactInfo.phoneNumber loginInfo.email').lean();
        return {
          hcmId: hcm.hcmId ? hcm.hcmId._id : 'Unknown HCM ID',
          hcmName: hcm.hcmId ? hcm.hcmId.name : 'Unknown HCM',
          workedHours: hcm.workedHours,
          workedUnits: hcm.workedUnits,
          serviceDetails: hcm.serviceDetails,
          hcmInfo: hcmInfoRecord
        };
      }));

      return {
        tenantId: serviceTracking.tenantId ? serviceTracking.tenantId._id : 'Unknown Tenant ID',
        tenantName: serviceTracking.tenantId ? serviceTracking.tenantId.name : 'Unknown Tenant',
        assignedHCMs,
        serviceType: serviceTracking.serviceType,
        period: `${serviceTracking.startDate.toISOString().split('T')[0]} to ${serviceTracking.endDate.toISOString().split('T')[0]}`,
        totalUnits: serviceTracking.totalUnits,
        unitsRemaining: serviceTracking.unitsRemaining,
        scheduledUnits: serviceTracking.scheduledUnits,
        workedUnits: serviceTracking.workedUnits,
        workedHours: serviceTracking.workedHours
      };
    }));

    return res.status(200).json({ success: true, message: "Plan usage fetched successfully", response });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getBillsPending = async (req, res) => {
  const { companyId } = req.params;
  try {
    const billPending = await Bill.find({ companyId, status: 'pending' });
    res.status(200).json({
      success: true, message: "Bill pending fetched successfully", response: {
        "count": billPending.length,
        "pendingBills": billPending
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message, response: error });
  }
};
export const getBillsDone = async (req, res) => {
  const { companyId } = req.params;
  try {
    const billingDone = await Bill.find({ companyId, status: 'done' });
    res.status(200).json({
      success: true, message: "Bills done fetched successfully", response: {
        "count": billingDone.length,
        "doneBills": billingDone
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message, response: error });
  }
};
export const getBillsGenerated = async (req, res) => {
  try {
    // Fetch bills from both collections
    const billingPending = await billingPending.find();
    const billingDone = await billingDone.find();

    // Combine the results
    const allBills = [...billingPending, ...billingDone];

    res.status(200).json({
      success: true,
      message: "Bills generated fetched successfully",
      response: allBills
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(400).json({
      success: false,
      message: error.message,
      response: error
    });
  }
};

export const markBillAsPaid = async (req, res) => {
  try {
    const { billId } = req.body;

    // Find the bill in the billingPending collection
    const bill = await billingPending.findById(billId);
    if (!bill) {
      return res.status(404).json({ success: false, message: "Bill not found" });
    }

    // Create a new document in the billingDone collection
    const billDone = new billingDone({
      ...bill.toObject(),
    });
    await billDone.save();

    // Remove the bill from the billingPending collection
    await billingPending.findByIdAndDelete(billId);

    res.status(200).json({ success: true, message: "Bill marked as paid and moved to billingDone", response: billDone });
  } catch (error) {
    console.error('Error marking bill as paid:', error);
    res.status(400).json({ success: false, message: error.message, response: error });
  }
};




export const getbillsPending = async (req, res) => {
  try {
    const billingPending = await billingPending.find();
    res.status(200).json({ success: true, message: "Bills pending fetched successfully", response: billingPending });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message, response: error });
  }
};

export const getBillsRejected = async (req, res) => {
  try {
    const billsRejected = await Bill.find({ status: 'rejected' });
    res.status(200).json({ success: true, message: "Bills rejected fetched successfully", response: billsRejected });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message, response: error });
  }
};

export const getBillClaim = async (req, res) => {
  try {
    const { tenantId, serviceType } = req.body;
    const billClaim = await Bill.find({ tenantId, serviceType });
    res.status(200).json({ success: true, message: "Bill claim fetched successfully", response: billClaim });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message, response: error });
  }
};


export const getBillsPendingByTenant = async (req, res) => {
  try {
    const { tenantId } = req.body;

    // Fetch pending bills and populate the 'bill' field with data from the 'bills' collection
    // Also populate the 'visit' field within each 'bill', which further populates the actual visit
    const pendingBills = await billingPending.find({ tenant: tenantId })
      .populate({
        path: 'bill',
        populate: {
          path: 'visit', // This is the field in the 'Bill' schema
          model: 'approvedvisits', // Ensure this matches the model name for visits
          populate: {
            path: 'visit', // This is the field in the 'Visits' schema
            model: 'visits' // Ensure this matches the actual visits model name
          }
        }
      });

    // Extract the populated bill data
    const bills = pendingBills.map(pendingBill => pendingBill.bill);

    return res.status(200).json({
      success: true,
      message: "Bills fetched successfully",
      response: {
        "Bills": bills
      }
    });
  } catch (error) {
    console.error('Error in getBillsPendingByTenant:', error);
    return res.status(500).json({ success: false, message: 'Error fetching bills', error: error.message || error });
  }
}

export const getBillsCompletedByTenant = async (req, res) => {
  try {
    const { tenantId } = req.body;
    const completedBills = await billingDone.find({ tenant: tenantId });

    const bills = completedBills.map(completedBill => completedBill.bill);
    return res.status(200).json({ success: true, message: "Bills fetched successfully", response: bills });
  } catch (error) {
    console.error('Error in getBillCompletedByTenant:', error);
    return res.status(500).json({ success: false, message: 'Error fetching bills', error: error.message || error });
  }
}

export const createBill = async (req, res) => {
  try {
    const { tenantId, serviceType, startTime, endTime, amount } = req.body;

    // Validate required fields
    if (!tenantId || !serviceType || !startTime || !endTime || !amount) {
      return res.status(400).json({
        success: false,
        message: 'tenantId, serviceType, startTime, endTime, and amount are required.',
        response: null
      });
    }

    // Parse startTime and endTime as Date objects
    const billStartTime = new Date(startTime);
    const billEndTime = new Date(endTime);

    // Ensure startTime is before endTime
    if (billStartTime >= billEndTime) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be before end time.',
        response: null
      });
    }

    // Create the bill
    const newBill = new Bill({
      tenantId,
      serviceType,
      startTime: billStartTime,
      endTime: billEndTime,
      amount
    });

    await newBill.save();
    res.status(200).json({
      success: true,
      message: 'Bill created successfully',
      response: newBill
    });
  } catch (error) {
    console.error('Error in createBill:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      response: error.message
    });
  }
}; 