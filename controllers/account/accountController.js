import accountSetup from "../../models/account/accountSetup.js";
import bcrypt from 'bcrypt';
import Users from '../../models/account/users.js';
import childAdminAccount from '../../models/account/childAdminAccount.js';
import settings from '../../models/account/settings.js';
import mongoose from 'mongoose';


export const getSuperAdminDetails = async (req, res) => {
    const { superAdminId } = req.body;
    try {
        const superAdmin = await Users.find({ _id: superAdminId });

        res.status(200).json({
            success: true,
            message: "Super Admin Details fetched successfully",
            response: superAdmin
        });
    } catch (error) {
        console.error('Error fetching tenant visit compliance reports:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching tenant visit compliance reports.'
        });
    }
};

//OFFICE ADMIN ACCOUNT

//office admin account setup
export const officeAdminAccountSetupController = async (req, res) => {
    try {
        const { adminId, accountData, companyId } = req.body;

        // Fetch user details
        const user = await Users.findById(adminId);
        if (!user) {
            return res.status(302).json({ success: false, message: "User not found" });
        }

        if (user.accountSetup) {
            return res.status(302).json({ success: false, message: "Account already setup" });
        }
        // Initialize childAdminAccounts if it doesn't exist
        if (!accountData.childAdminAccounts) {
            accountData.childAdminAccounts = [];
        }

        const childAdminAccounts = new childAdminAccount({
            adminId,
            ...accountData.childAdminAccounts,
            companyId: user.companyId
        });
        await childAdminAccounts.save();

        // Add the new childAdminAccount ID to the array
        accountData.childAdminAccounts.push(childAdminAccounts._id);

        // Create AccountSetup document
        const accSetup = new accountSetup({
            ...accountData,
            adminId: user._id,
            companyId: user.companyId
        });

        await accSetup.save();

        // Convert adminId to ObjectId using 'new'
        const adminObjectId = new mongoose.Types.ObjectId(adminId);

        // Fetch or create settings document
        let settingsDocument = await settings.findOne({ userId: adminObjectId });

        if (!settingsDocument) {
            // If no document is found, create a new one
            settingsDocument = new settings({ userId: adminObjectId, accountDetails: accSetup._id });
        } else {
            // Update existing document
            settingsDocument.accountDetails = accSetup._id;
        }
        await settingsDocument.save();

        // Update user's accountSetup field
        user.accountSetup = true;
        await user.save();

        res.status(200).json({
            success: true, message: "Account setup successfully", response: {
                "accountSetup": accSetup,
                "user": user,
                "settings": settingsDocument
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "An error occurred", error: error.message });
    }
}



// Fetch Account Details
export const fetchAccountDetails = async (req, res) => {
    const { adminId } = req.query;
    const adminIdObject = new mongoose.Types.ObjectId(adminId);
    try {

        const accountDetails = await accountSetup.findOne({ adminId: adminIdObject });

        if (!accountDetails) {
            return res.status(400).json({ success: false, message: "Account details not found", response: null });
        }
        // Respond with the account details
        res.status(200).json({
            success: true, message: "Account details fetched successfully", response: {
                "account-details": accountDetails,
            }
        });
    } catch (error) {
        console.error('Error fetching account details:', error);
        res.status(500).json({ success: false, message: "Error fetching account details" });
    }
};

export const updateAccountDetails = async (req, res) => {
    const { adminId, accountDetails } = req.body;
    console.log(accountDetails);
    const adminIdObject = new mongoose.Types.ObjectId(adminId);

    try {

        const accountDetailsDocument = await accountSetup.findOne({ adminId: adminIdObject });

        const updatedAccountDetails = {
            email: accountDetails.email ?? accountDetailsDocument.email,
            firstName: accountDetails.firstName ?? accountDetailsDocument.firstName,
            lastName: accountDetails.lastName ?? accountDetailsDocument.lastName,
            companyName: accountDetails.companyName ?? accountDetailsDocument.companyName,
            address: accountDetails.address ?? accountDetailsDocument.address,
            contact: accountDetails.contact ?? accountDetailsDocument.contact,
            federalTaxId: accountDetails.federalTaxId ?? accountDetailsDocument.federalTaxId,
            idnpiUmpi: accountDetails.idnpiUmpi ?? accountDetailsDocument.idnpiUmpi,
            taxonomy: accountDetails.taxonomy ?? accountDetailsDocument.taxonomy,
        }
        if (!accountDetailsDocument) {
            return res.status(400).json({ success: false, message: "Account details not found" });
        }
        await accountSetup.findOneAndUpdate({ adminId: adminIdObject }, updatedAccountDetails, { new: true });

        const userDocument = await Users.findOne({ _id: adminIdObject });

        if (!userDocument) {
            return res.status(400).json({ success: false, message: "Email already exists", response: null });
        }
        // Create a new user
        const fullName = updatedAccountDetails.firstName + (updatedAccountDetails.lastName ? " " + updatedAccountDetails.lastName : "");
        const user = new Users({
            name: fullName || userDocument.name,
            email: updatedAccountDetails.email || userDocument.email,
            phoneNo: updatedAccountDetails.contact.cellPhoneNumber ?? updatedAccountDetails.contact.officePhoneNumber ?? userDocument.phoneNo,
        });

        const updatedUser = await Users.findOneAndUpdate({ _id: adminIdObject }, user, { new: true });

        res.status(200).json({
            success: true,
            message: "Account details updated successfully",
            response: { "account-details": updatedAccountDetails, "updated-user": updatedUser }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "An error occurred", error: error.message });
    }
}


export const deleteAccountDetails = async (req, res) => {
    const { adminId } = req.query;
    const adminIdObject = new mongoose.Types.ObjectId(adminId);
    const accountDetailsDocument = await accountSetup.findOne({ adminId: adminIdObject });
    const settingsDocument = await settings.findOne({ userId: adminIdObject });
    await accountDetailsDocument.deleteOne();
    settingsDocument.accountDetails = null;
    const updatedSettingsDocument = await settingsDocument.save();
    const user = await Users.findOne({ info_id: adminIdObject });
    user.accountSetup = false;
    const updatedUser = await user.save();

    res.status(200).json({
        success: true, message: "Account details deleted successfully", response: {
            "updated-settings": updatedSettingsDocument,
            "deleted-account-details": accountDetailsDocument,
            "updated-user": updatedUser
        }
    });
}

//CHILD ADMIN ACCOUNT

//add child admin account
export const addChildAdminAccount = async (req, res) => {
    const { adminId, childAdminData, companyId } = req.body;
    const adminIdObject = new mongoose.Types.ObjectId(adminId);
    const companyIdObject = new mongoose.Types.ObjectId(companyId);
    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(childAdminData.password, 10);

        // Remove any existing _id from childAdminData to avoid duplicate key error
        // delete childAdminData._id;
        const users = await Users.find({ email: childAdminData.username });
        if (users.length > 0) {
            return res.status(400).json({ success: false, message: "Email already exists", response: null });
        }
        // Create a new childAdminAccount instance
        const childadminaccount = new childAdminAccount({
            firstName: childAdminData.firstName,
            lastName: childAdminData.lastName,
            address: childAdminData.address,
            contact: childAdminData.contact,
            username: childAdminData.username,
            password: hashedPassword,
            permissions: childAdminData.permissions,
            adminId: adminIdObject,
            companyId: companyIdObject
        });
        console.log(childadminaccount);
        const savedChildAdminAccount = await childadminaccount.save();
        console.log(savedChildAdminAccount);
        // Update accountSetup
        const accountSet = await accountSetup.findOne({ adminId: adminIdObject });
        if (!accountSet) {
            return res.status(400).json({ success: false, message: "Account Setup not found" });
        }
        accountSet.childAdminAccounts.push(savedChildAdminAccount._id);
        await accountSet.save();

        const isEmailExist = await Users.findOne({ email: childAdminData.username });

        if (isEmailExist) {
            return res.status(400).json({ success: false, message: "Email already exists", response: null });
        }
        // Create a new user
        const fullName = childAdminData.firstName + (childAdminData.lastName ? " " + childAdminData.lastName : "");
        const user = new Users({
            name: fullName,
            email: childAdminData.username,
            password: hashedPassword, // Use the hashed password
            companyId: companyIdObject,
            companyName: adminId.companyName,
            dateCreated: Date.now(),
            role: 21,
            accountSetup: true,
            info_id: savedChildAdminAccount._id
        });
        await user.save();

        res.status(200).json({
            success: true, message: "Child Admin Account added successfully", response: {
                "childadminaccount": savedChildAdminAccount,
                "user": user,
                "accountSetup": accountSet
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "An error occurred", error: error.message });
    }
}

export const getChildAdminAccounts = async (req, res) => {
    const { adminId } = req.query;
    const childAdminAcc = await childAdminAccount.find({ adminId: adminId });
    res.status(200).json({
        success: true, message: "Child Admin Account Details fetched successfully", response: {
            "childAdminAccounts": childAdminAcc
        }
    });
}

export const updateChildAdminAccount = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    console.log(updateData);
    const objectId = new mongoose.Types.ObjectId(id);
    try {
        // Fetch the existing childAdminAccount
        const existingChildAdminAccount = await childAdminAccount.findById(objectId);
        if (!existingChildAdminAccount) {
            return res.status(404).json({ success: false, message: "Child Admin Account not found" });
        }
        let hashedPassword = '';
        // Update the childAdminAccount
        const updatedChildAdminAccount = await childAdminAccount.findOneAndUpdate({ _id: objectId }, updateData, { new: true });

        // Update the corresponding user record
        const userUpdateData = {
            firstName: (updateData.firstName || existingChildAdminAccount.firstName),
            lastName: (updateData.lastName ? existingChildAdminAccount.lastName : ""),
            email: updateData.username || existingChildAdminAccount.username,
            permissions: {
                billing: updateData.permissions?.billing ?? existingChildAdminAccount.permissions.billing,
                tenant: updateData.permissions?.tenant ?? existingChildAdminAccount.permissions.tenant,
                hcm: updateData.permissions?.hcm ?? existingChildAdminAccount.permissions.hcm,
                appointments: updateData.permissions?.appointments ?? existingChildAdminAccount.permissions.appointments,
                visit: updateData.permissions?.visit ?? existingChildAdminAccount.permissions.visit,
                communication: updateData.permissions?.communication ?? existingChildAdminAccount.permissions.communication
            },
            address: {
                streetAddress: updateData.address?.streetAddress ?? existingChildAdminAccount.address.streetAddress,
                city: updateData.address?.city ?? existingChildAdminAccount.address.city,
                state: updateData.address?.state ?? existingChildAdminAccount.address.state,
                zipCode: updateData.address?.zipCode ?? existingChildAdminAccount.address.zipCode,
                country: updateData.address?.country ?? existingChildAdminAccount.address.country
            },
            contact: {
                officePhoneNumber: updateData.contact?.officePhoneNumber ?? existingChildAdminAccount.contact.officePhoneNumber,
                cellPhoneNumber: updateData.contact?.cellPhoneNumber ?? existingChildAdminAccount.contact.cellPhoneNumber,
                primaryEmailAddress: updateData.contact?.primaryEmailAddress ?? existingChildAdminAccount.contact.primaryEmailAddress,
                alternateEmailAddress: updateData.contact?.alternateEmailAddress ?? existingChildAdminAccount.contact.alternateEmailAddress
            },
            dateUpdated: Date.now()
        };
        if (updateData.password) {
            hashedPassword = await bcrypt.hash(updateData.password, 10);
            userUpdateData.password = hashedPassword;
        }

        await childAdminAccount.findOneAndUpdate({ _id: objectId }, userUpdateData, { new: true });

        // Find the existing user
        const existingUser = await Users.findOne({ info_id: objectId });
        let updatedUserData = {
            name: userUpdateData.firstName + " " + (userUpdateData.lastName ? userUpdateData.lastName : ""),
            email: userUpdateData.email || existingUser.email,
            password: userUpdateData.password || existingUser.password,
            dateUpdated: Date.now()
        }
        // Update the user with merged data
        await Users.findOneAndUpdate({ info_id: objectId }, updatedUserData);

        res.status(200).json({
            success: true,
            message: "Child Admin Account Details updated successfully",
            response: {
                "updated childadminaccount": updatedChildAdminAccount,
                "updated user": updatedUserData
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "An error occurred", error: error.message });
    }
}

export const deleteChildAdminAccount = async (req, res) => {
    const { id } = req.params;
    const { adminId } = req.body;
    console.log(id, adminId);
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(adminId)) {
        return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    const idObject = new mongoose.Types.ObjectId(id);
    const adminIdObject = new mongoose.Types.ObjectId(adminId);

    try {
        // Delete the child admin account
        const childAdminAcc = await childAdminAccount.findByIdAndDelete({ _id: idObject });
        if (!childAdminAcc) {
            console.log(`Child admin account with ID ${id} not found.`);
        }

        // Delete the associated user record
        const user = await Users.findOneAndDelete({ info_id: idObject });
        if (!user) {
            console.log(`User with info_id ${id} not found.`);
        }

        // Find the account setup document
        const accountSet = await accountSetup.findOne({ adminId: adminIdObject });
        if (accountSet) {
            // Remove the childAdminAccount ID from the childAdminAccounts array
            accountSet.childAdminAccounts.pull(idObject);
            // Save the updated document to persist changes
            await accountSet.save();
        }

        res.status(200).json({
            success: true,
            message: "Child Admin Account Details deleted successfully",
            response: {
                "childAdminAccount": childAdminAcc,
                "accountSetup": accountSet,
                "user": user
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while deleting the Child Admin Account",
            error: error.message
        });
    }
}