import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const setupUploadDirectories = () => {
    const rootDir = path.join(__dirname, '..');
    const uploadsDir = path.join(rootDir, 'uploads');
    const servicesDir = path.join(uploadsDir, 'services');

    // Create directories if they don't exist
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
    }
    if (!fs.existsSync(servicesDir)) {
        fs.mkdirSync(servicesDir);
    }

    return {
        uploadsDir,
        servicesDir
    };
}; 