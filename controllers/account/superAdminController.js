import mongoose from 'mongoose';
import Company from '../../models/account/company.js';
import Users from '../../models/account/users.js';
import childAdminAccount from '../../models/account/childAdminAccount.js';
import settings from '../../models/account/settings.js';
import bcrypt from 'bcrypt';

const getCompanyReports = async (req, res) => {
    try {
        // Fetch all companies
        const companies = await Company.find();
        if (companies.length === 0) {
            return res.status(400).json({ success: false, message: 'No companies found' });
        }

        // Initialize an array to hold all company reports
        const companyReports = [];

        // Iterate over each company
        for (const company of companies) {
            const companyRecord = await Company.findOne({ _id: company._id });
            // Fetch all users associated with the current company
            const usersData = await Users.find({ companyId: companyRecord });

            if (usersData.length === 0) {
                continue; // Skip if no users are found for this company
            }

            // Identify the admin (assuming the first user is the admin)
            const admin = usersData.find(user => user.role === 2);
            if (!admin) {
                continue; // Skip if no admin is found
            }
            const adminDetails = {
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                phoneNo: admin.phoneNo,
                password: admin.password,
                createdAt: admin.createdAt,
                companyId: admin.companyId
            };
            const childAdminAccounts = await childAdminAccount.find({ adminId: admin._id });
            // Gather tenants and HCMs data
            const tenants = usersData.filter(user => user.role === 0).map(tenant => ({
                _id: tenant._id,
                name: tenant.name,
                email: tenant.email,
                phoneNo: tenant.phoneNo,
                dateCreated: tenant.dateCreated,
                companyId: tenant.companyId
            }));

            const hcms = usersData.filter(user => user.role === 1).map(hcm => ({
                _id: hcm._id,
                name: hcm.name,
                email: hcm.email,
                phoneNo: hcm.phoneNo
            }));

            // Prepare the report for the current company
            const report = {
                company: {
                    id: company._id,
                    name: company.companyName,
                },
                admin: adminDetails,
                childAdminAccounts: childAdminAccounts,
                tenantsCount: tenants.length,
                hcmsCount: hcms.length,
                tenants, // Include tenant details
                hcms // Include HCM details
            };

            // Add the report to the array
            companyReports.push(report);
        }

        res.status(200).json({ success: true, message: "Company reports fetched successfully", response: companyReports });
    } catch (error) {
        console.error('Error fetching company reports:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

//update company data
const updateCompanyData = async (req, res) => {
    const { adminId, adminName, adminEmail, adminPhoneNo, adminPassword } = req.body;
    try {
        const admin = await Users.findOne({ _id: adminId });
        if (!admin) {
            return res.status(400).json({ success: false, message: "Admin not found" });
        }
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const updatedAdmin = {
            name: adminName ? adminName : admin.name,
            email: adminEmail ? adminEmail : admin.email,
            phoneNo: adminPhoneNo ? adminPhoneNo : admin.phoneNo,
            password: adminPassword ? hashedPassword : admin.password,
        }
        const updatedAdminDocument = await Users.findOneAndUpdate({ _id: adminId }, updatedAdmin, { new: true });

        res.status(200).json({
            success: true, message: "Admin updated successfully", response: {
                "updated admin data": updatedAdminDocument
            }
        });
    }
    catch (error) {
        console.error('Error updating company data:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
}

//delete company
const deleteCompany = async (req, res) => {
    const { companyId } = req.params;
    const companyObjectId = new mongoose.Types.ObjectId(companyId);
    try {
        await Company.findOneAndDelete({ _id: companyObjectId });
        await Users.deleteMany({ companyId: companyObjectId });
        await childAdminAccount.deleteMany({ companyId: companyObjectId });
        await settings.deleteMany({ companyId: companyObjectId });
        res.status(200).json({ success: true, message: "Company deleted successfully" });
    }
    catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
}

export { getCompanyReports, updateCompanyData, deleteCompany };