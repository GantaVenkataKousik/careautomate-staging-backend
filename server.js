//  --> /api/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import connectDB from "./config/db.js";
import authRoute from './routes/account/authRoute.js';
import tenantRoute from './routes/hcm-tenants/tenantRoute.js';
import fetchAllRoute from "./routes/hcm-tenants/fetchAllRoute.js";
import hcmRoutes from './routes/hcm-tenants/hcmRoute.js';
import { setupUploadDirectories } from './utils/setupDirectories.js';
import path from 'path';
import fs from 'fs';
import appointmentRoute from './routes/appointments-visits/appointmentRoute.js';
import visitRoute from './routes/appointments-visits/visitRoute.js';
import serviceTrackingRoute from './routes/bills-service-tracking/serviceTrackingRoute.js';
import billRoute from './routes/bills-service-tracking/billRoute.js';
import './tasks/billGeneration.js';
import settingsRoute from './routes/reports/settingsRoute.js';
import { fileURLToPath } from 'url';
import documentRoute from './routes/communication-documents/documentRoute.js';
import reportsRoute from './routes/reports/reportsRoute.js';
import accountRoute from './routes/account/accountRoute.js';
import superAdminRoute from './routes/account/superAdminRoute.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

connectDB();

const app = express();
app.use(cors({
  origin: '*',
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Increase payload size limit
app.use(bodyParser.json({ limit: '50mb' })); // Adjust the limit as needed
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
// Setup upload directories
setupUploadDirectories();
try {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const servicesDir = path.join(uploadsDir, 'services');
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.mkdirSync(servicesDir, { recursive: true });
  console.log('Upload directories created successfully');
} catch (error) {
  console.error('Error creating upload directories:', error);
}
// uploadData();
// API routes
app.use("/auth", authRoute);
app.use("/fetchAll", fetchAllRoute);
app.use("/tenant", tenantRoute);
app.use("/visit", visitRoute);
app.use('/hcm', hcmRoutes);
app.use('/appointment', appointmentRoute);
app.use('/visits', visitRoute);
app.use('/serviceTracking', serviceTrackingRoute);
app.use('/bill', billRoute);
app.use('/settings', settingsRoute);
app.use('/document', documentRoute);
app.use('/reports', reportsRoute);
app.use('/account', accountRoute);
app.use('/super-admin', superAdminRoute);

app.use(express.static('public'));

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Housing Services</title>
      <style>
        body {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          font-family: Arial, sans-serif;
          background-color: #f0f0f0;
        }
        .container {
          text-align: center;
        }
        h1 {
          color: #333;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Welcome to Housing Services</h1>
      </div>
    </body>
    </html>
  `);
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
