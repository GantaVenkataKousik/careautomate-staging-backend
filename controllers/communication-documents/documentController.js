import Document from '../../models/communication-documents/document.js';
import path from 'path';
import fs from 'fs';
import cloudinary from 'cloudinary';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Upload document
export const uploadDocument = async (req, res) => {
    try {
        const file = req.file;
        const { userId, folderName, year } = req.body;

        if (!file) {
            console.error('No file uploaded');
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        console.log('File:', file);
        console.log('Request body:', req.body);

        // Directly upload to Cloudinary using the buffer
        cloudinary.v2.uploader.upload_stream(
            {
                folder: 'services',
                resource_type: 'auto',
            },
            async (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    return res.status(500).json({
                        success: false,
                        message: 'Error uploading document',
                        error: process.env.NODE_ENV === 'development' ? error.message : 'Upload failed'
                    });
                }

                const newDocument = new Document({
                    userId,
                    folderName,
                    fileName: file.originalname,
                    filePath: result.secure_url,
                    originalName: file.originalname,
                    mimeType: file.mimetype,
                    cloudinaryId: result.public_id,
                    year: new Date(year).getFullYear().toString()
                });
                const savedDocument = await newDocument.save();

                return res.status(200).json({
                    success: true,
                    message: 'Document uploaded successfully',
                    response: {
                        document: savedDocument
                    }
                });
            }
        ).end(file.buffer); // Use file.buffer to end the stream

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
export const fetchDocuments = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "Tenant ID is required"
            });
        }

        // Validate tenantId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid tenant ID format"
            });
        }

        // Check if tenant exists
        const tenant = await users.findById(userId);
        if (!tenant) {
            return res.status(404).json({
                success: false,
                message: "Tenant not found"
            });
        }

        // Find all documents for this tenant with populated tenant details
        const documents = await Document.find({ userId })
            .populate({
                path: 'tenantId',
                select: 'name email phoneNo',
                model: 'users'
            })
            .sort({ createdAt: -1 }); // Sort by newest first

        // Format the response
        const formattedDocuments = documents.map(doc => ({
            ...doc.toObject(),
            tenantDetails: doc.tenantId
        }));

        res.status(200).json({
            success: true,
            message: "Documents fetched successfully",
            response: formattedDocuments
        });

    } catch (error) {
        console.error('Error in fetchDocuments:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Error fetching documents"
        });
    }
};
export const getDocuments = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId is required.' });
        }

        const documents = await Document.find({ userId });

        return res.status(200).json({
            success: true,
            message: "Documents fetched successfully",
            response: {
                "Documents": documents
            }
        });
    } catch (error) {
        console.error('Error in getDocument:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching documents'
        });
    }
};