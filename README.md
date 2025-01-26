# CareAutomate Backend API Documentation

## Service Management Routes

### Assign Service with Document
- **Route**: `POST /tenant/assign-services-documents`
- **Headers**: 
  ```json
  {
    "Authorization": "Bearer {token}",
    "Content-Type": "multipart/form-data"
  }
  ```
- **Request Body** (Form Data):
  ```
  tenantId: string (required)
  serviceType: string (required)
  startDate: string (required, YYYY-MM-DD)
  endDate: string (required, YYYY-MM-DD)
  units: number (required)
  rate: number (required)
  document: File (optional)
  ```
- **Success Response** (200):
  ```json
  {
    "success": true,
    "message": "Service assigned successfully",
    "service": {
      "_id": "string",
      "tenantId": "string",
      "serviceType": "string",
      "startDate": "string",
      "endDate": "string",
      "units": number,
      "rate": number,
      "document": {
        "fileName": "string",
        "filePath": "string",
        "originalName": "string",
        "mimeType": "string"
      },
      "status": "pending",
      "reviewStatus": "pending",
      "createdAt": "date",
      "updatedAt": "date",
      "tenantDetails": {
        "name": "string",
        "email": "string",
        "phoneNo": "string"
      }
    }
  }
  ```

### Get Tenant Services
- **Route**: `POST /tenant/get-services`
- **Headers**: 
  ```json
  {
    "Authorization": "Bearer {token}",
    "Content-Type": "application/json"
  }
  ```
- **Request Body**:
  ```json
  {
    "tenantId": "string"
  }
  ```
- **Success Response** (200):
  ```json
  {
    "success": true,
    "message": "Services fetched successfully",
    "services": [{
      "_id": "string",
      "tenantId": "string",
      "serviceType": "string",
      "startDate": "string",
      "endDate": "string",
      "units": number,
      "rate": number,
      "document": {
        "fileName": "string",
        "filePath": "string",
        "originalName": "string",
        "mimeType": "string"
      },
      "status": "string",
      "reviewStatus": "string",
      "createdAt": "date",
      "updatedAt": "date",
      "tenantDetails": {
        "name": "string",
        "email": "string",
        "phoneNo": "string"
      }
    }]
  }
  ```

### Update Service Status
- **Route**: `POST /tenant/update-service-status`
- **Headers**: 
  ```json
  {
    "Authorization": "Bearer {token}",
    "Content-Type": "application/json"
  }
  ```
- **Request Body**:
  ```json
  {
    "serviceId": "string",
    "status": "string" (optional),
    "reviewStatus": "string" (optional)
  }
  ```
- **Status Options**: ['pending', 'active', 'completed', 'cancelled']
- **Review Status Options**: ['pending', 'approved', 'rejected']
- **Success Response** (200):
  ```json
  {
    "success": true,
    "message": "Service status updated successfully",
    "service": {
      // Updated service object
    }
  }
  ```

### Error Responses
All endpoints may return these error responses:
- **400 Bad Request**:
  ```json
  {
    "success": false,
    "message": "Validation error message"
  }
  ```
- **401 Unauthorized**:
  ```json
  {
    "success": false,
    "message": "Access token is required"
  }
  ```
- **404 Not Found**:
  ```json
  {
    "success": false,
    "message": "Resource not found message"
  }
  ```
- **500 Server Error**:
  ```json
  {
    "success": false,
    "message": "Error message"
  }
  ```

### File Upload Specifications
- **Supported File Types**: PDF, JPEG, PNG
- **Maximum File Size**: 10MB
- **File Storage**: Files are stored in `/uploads/services/` directory
- **File Naming**: Unique filename generated using timestamp

### Validation Rules
1. **Required Fields**:
   - tenantId
   - serviceType
   - startDate
   - endDate
   - units
   - rate

2. **Field Validations**:
   - tenantId must be valid MongoDB ObjectId
   - startDate and endDate must be valid dates
   - units and rate must be positive numbers
   - document file must be of supported type and size

3. **Business Rules**:
   - Tenant must exist in database
   - Service status changes follow specific workflow
   - Review status changes require appropriate permissions

### Document Management Routes

#### Upload HCM Document
- **Route**: `POST /hcm/upload-document`
- **Headers**: 
  ```json
  {
    "Authorization": "Bearer {token}",
    "Content-Type": "multipart/form-data"
  }
  ```
- **Request Body** (Form Data):
  ```
  hcmId: string (required)
  folderName: string (required)
  document: File (required)
  ```
- **Success Response** (200):
  ```json
  {
    "success": true,
    "message": "Document uploaded successfully",
    "document": {
      "_id": "string",
      "fileName": "string",
      "filePath": "string",
      "folderName": "string"
    }
  }
  ```
- **Error Responses**:
  - `400`: Bad Request
    ```json
    {
      "success": false,
      "message": "No file uploaded"
    }
    ```
  - `404`: Not Found
    ```json
    {
      "success": false,
      "message": "HCM not found"
    }
    ```
  - `500`: Server Error
    ```json
    {
      "success": false,
      "message": "Error uploading document",
      "error": "Error details in development mode"
    }
    ```

#### Get HCM Documents
- **Route**: `POST /hcm/get-documents`
- **Headers**: 
  ```json
  {
    "Authorization": "Bearer {token}",
    "Content-Type": "application/json"
  }
  ```
- **Request Body**:
  ```json
  {
    "hcmId": "string"
  }
  ```
- **Success Response** (200):
  ```json
  {
    "success": true,
    "message": "Documents fetched successfully",
    "documents": [{
      "_id": "string",
      "hcmId": "string",
      "folderName": "string",
      "fileName": "string",
      "filePath": "string",
      "originalName": "string",
      "mimeType": "string",
      "cloudinaryId": "string",
      "year": "string",
      "reviewComplete": boolean,
      "createdAt": "date",
      "updatedAt": "date",
      "hcmDetails": {
        "name": "string",
        "email": "string",
        "phoneNo": "string"
      }
    }]
  }
  ```

### Document Validation Rules
1. **Required Fields**:
   - hcmId (MongoDB ObjectId)
   - folderName (string)
   - document (file)

2. **File Specifications**:
   - Supported Types: PDF, JPEG, PNG
   - Maximum Size: 5MB
   - Storage: Cloudinary cloud storage
   - Folder Path: 'hcm-documents/'

3. **Metadata**:
   - Year: Automatically set to current year
   - Review Status: reviewComplete (boolean)
   - Cloudinary ID: Stored for reference
   - Created/Updated timestamps: Automatically managed

4. **Business Rules**:
   - HCM must exist in database
   - File must be of supported type
   - File size must be within limits
   - Documents are stored by HCM and folder
   - Review status changes require appropriate permissions

### Appointment Management Routes

#### Create Schedule/Appointment
- **Route**: `POST /tenant/create-schedule`
- **Headers**: 
  ```json
  {
    "Authorization": "Bearer {token}",
    "Content-Type": "application/json"
  }
  ```
- **Request Body**:
  ```json
  {
    "tenantId": "string (ObjectId)",
    "hcmId": "string (ObjectId)",
    "date": "YYYY-MM-DD",
    "startTime": "string (HH:mm)",
    "endTime": "string (HH:mm)",
    "activity": "string",
    "methodOfContact": "in-person|remote",
    "reasonForRemote": "string (required if methodOfContact is remote)",
    "placeOfService": "string",
    "serviceType": "string"
  }
  ```

#### Get Appointments
- **Route**: `POST /tenant/get-appointments`
- **Headers**: 
  ```json
  {
    "Authorization": "Bearer {token}",
    "Content-Type": "application/json"
  }
  ```
- **Request Body**:
  ```json
  {
    "tenantId": "string (ObjectId, optional)",
    "hcmId": "string (ObjectId, optional)",
    "status": "string (optional)"
  }
  ```

#### Filter Appointments
- **Route**: `POST /appointment/filterAppointments`
- **Headers**: 
  ```json
  {
    "Authorization": "Bearer {token}",
    "Content-Type": "application/json"
  }
  ```
- **Request Body** (all fields optional):
  ```json
  {
    "hcmId": "string (ObjectId)",
    "tenantId": "string (ObjectId)",
    "status": "string (enum: pending, confirmed, completed, cancelled)",
    "approved": "boolean"
  }
  ```

#### Fetch All Appointments
- **Route**: `POST /appointment/fetchAppointments`
- **Headers**: 
  ```json
  {
    "Authorization": "Bearer {token}",
    "Content-Type": "application/json"
  }
  ```
- **Request Body**: Empty (no filters)
  ```json
  {}
  ```

### Common Response Format (for both endpoints)
- **Success Response** (200):
  ```json
  {
    "success": true,
    "message": "Appointments fetched and grouped successfully",
    "appointments": {
      "completed": {
        "2024": {
          "Nov": {
            "12": [
              {
                "_id": "string",
                "hcmId": "string",
                "tenantId": "string",
                "date": "2024-11-12T00:00:00.000Z",
                "startTime": "string",
                "endTime": "string",
                "activity": "string",
                "methodOfContact": "in-person|remote",
                "reasonForRemote": "string",
                "placeOfService": "string",
                "serviceType": "string",
                "approved": "boolean",
                "status": "string",
                "createdAt": "date",
                "updatedAt": "date",
                "hcmDetails": {
                  "name": "string",
                  "email": "string",
                  "phoneNo": "string"
                },
                "tenantDetails": {
                  "name": "string",
                  "email": "string",
                  "phoneNo": "string"
                }
              }
            ]
          }
        }
      },
      "upcoming": {},
      "cancelled": {}
    }
  }
  ```

- **Empty Response** (200):
  ```json
  {
    "success": true,
    "message": "No appointments found.",
    "appointments": {
      "completed": {},
      "upcoming": {},
      "cancelled": {}
    }
  }
  ```

- **Error Responses**:
  - `400`: Bad Request (Only for filterAppointments)
    ```json
    {
      "success": false,
      "message": "Invalid HCM ID format"
    }
    ```
    ```json
    {
      "success": false,
      "message": "Invalid Tenant ID format"
    }
    ```
    ```json
    {
      "success": false,
      "message": "Invalid status value"
    }
    ```
  - `500`: Server Error
    ```json
    {
      "success": false,
      "message": "Server error",
      "error": "Detailed error message in development mode"
    }
    ```

### Appointment Enums and Constants
1. **Method of Contact**:
   - `in-person`
   - `remote`

2. **Status Options**:
   - `pending`: Initial state
   - `confirmed`: Approved by HCM
   - `completed`: Service delivered
   - `cancelled`: Appointment cancelled

3. **Approval Status**:
   - `true`: Approved
   - `false`: Not approved (default)

### Validation Rules
1. **Required Fields**:
   - tenantId (MongoDB ObjectId)
   - hcmId (MongoDB ObjectId)
   - date (YYYY-MM-DD)
   - startTime (HH:mm)
   - endTime (HH:mm)
   - activity
   - methodOfContact
   - placeOfService
   - serviceType

2. **Conditional Fields**:
   - reasonForRemote (required when methodOfContact is 'remote')

3. **Business Rules**:
   - Date must be in the future
   - Both tenant and HCM must exist
   - Appointments are sorted by date and time
   - Initial status is 'pending'
   - Initial approval is false

### Status Options
- **Appointment Status**: ['pending', 'confirmed', 'completed', 'cancelled']

### Tenant Management Endpoints

#### Get All Tenants
- **Route**: `POST /tenant/all`
- **Headers**: 
  ```json
  {
    "Authorization": "Bearer {token}",
    "Content-Type": "application/json"
  }
  ```
- **Success Response** (200):
  ```json
  {
    "success": true,
    "tenants": [
      {
        "_id": "12345",
        "name": "John Doe"
      },
      {
        "_id": "67890",
        "name": "Jane Smith"
      }
    ]
  }
  ```

### HCM Management Endpoints

#### Get All HCMs
- **Route**: `POST /hcm/all`
- **Headers**: 
  ```json
  {
    "Authorization": "Bearer {token}",
    "Content-Type": "application/json"
  }
  ```
- **Success Response** (200):
  ```json
  {
    "success": true,
    "hcms": [
      {
        "_id": "string",
        "name": "string"
      }
    ]
  }
  ```
- **Error Response** (500):
  ```json
  {
    "success": false,
    "message": "Internal server error while fetching HCMs"
  }
  ```

#### Assign HCM to Multiple Tenants
- **Route**: `POST /hcm/assign-hcm`
- **Authentication**: Required
- **Description**: Assigns an HCM to multiple tenants
- **Request Headers**: 
  ```json
  {
    "Authorization": "Bearer {token}",
    "Content-Type": "application/json"
  }
  ```
- **Request Body**:
  ```json
  {
    "hcmId": "string (ObjectId)",
    "tenantIds": ["string (ObjectId)", "string (ObjectId)", ...]
  }
  ```
- **Success Response** (200):
  ```json
  {
    "success": true,
    "message": "HCM assignments processed",
    "hcm": {
      "_id": "hcm_id",
      "name": "HCM Name",
      "email": "hcm@example.com"
    },
    "assignments": [
      {
        "_id": "assignment_id",
        "tenant": {
          "_id": "tenant_id",
          "name": "Tenant Name",
          "email": "tenant@example.com"
        }
      }
    ],
    "errors": [
      "Error message for failed assignments (if any)"
    ]
  }
  ```
- **Error Responses**:
  - `400`: Bad Request
    ```json
    {
      "success": false,
      "message": "HCM ID and array of Tenant IDs are required"
    }
    ```
  - `404`: Not Found
    ```json
    {
      "success": false,
      "message": "HCM not found"
    }
    ```
  - `500`: Server Error
    ```json
    {
      "success": false,
      "message": "Error processing HCM assignments"
    }
    ```


### Service Tracking Routes

#### Get Units Remaining
- **Route**: `GET /serviceTracking/unitsRemaining`
- **Headers**: 
  ```json
  {
    "Authorization": "Bearer {token}"
  }
  ```
- **Query Parameters**:
  - `hcmId`: The ID of the healthcare manager (required)
  - `tenantId`: The ID of the tenant (required)
  - `serviceType`: The type of service (required)

- **Success Response** (200):
  ```json
  {
    "success": true,
    "unitsRemaining": number,
    "totalCost": "string (formatted to 2 decimal places)"
  }
  ```

- **Error Responses**:
  - **400 Bad Request**:
    ```json
    {
      "success": false,
      "message": "hcmId, tenantId, and serviceType are required"
    }
    ```
  - **404 Not Found**:
    ```json
    {
      "success": false,
      "message": "Service tracking information not found"
    }
    ```
  - **500 Server Error**:
    ```json
    {
      "success": false,
      "message": "Server error",
      "error": "Detailed error message in development mode"
    }
    ```

### Description

This route allows you to fetch the remaining units and their total cost for a specific healthcare manager, tenant, and service type. It is restricted to certain service types as defined in the application logic.
