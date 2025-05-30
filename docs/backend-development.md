
# Backend Development Guide

This guide covers implementing the Azure Functions backend for the event check-in system.

## Function App Structure

```
functions/
├── attendees/
│   ├── function.json
│   └── index.js
├── checkin/
│   ├── function.json
│   └── index.js
├── qr-generator/
│   ├── function.json
│   └── index.js
├── email-sender/
│   ├── function.json
│   └── index.js
├── forms-webhook/
│   ├── function.json
│   └── index.js
├── package.json
└── host.json
```

## Required NPM Packages

```json
{
  "name": "event-checkin-functions",
  "version": "1.0.0",
  "dependencies": {
    "@azure/cosmos": "^4.0.0",
    "@azure/storage-blob": "^12.17.0",
    "@azure/msal-node": "^2.6.0",
    "axios": "^1.6.0",
    "qrcode": "^1.5.3",
    "nodemailer": "^6.9.0",
    "jsonwebtoken": "^9.0.0",
    "validator": "^13.11.0"
  }
}
```

## Configuration Files

### host.json
```json
{
  "version": "2.0",
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true,
        "excludedTypes": "Request"
      }
    }
  },
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  },
  "functionTimeout": "00:10:00"
}
```

## API Endpoints

### 1. Attendees Management (`/api/attendees`)

**GET** - List all attendees with filters
```javascript
// attendees/index.js
const { CosmosClient } = require('@azure/cosmos');

module.exports = async function (context, req) {
    const client = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING);
    const container = client.database('EventCheckIn').container('Attendees');
    
    try {
        const { department, checkedIn } = req.query;
        
        let query = "SELECT * FROM c";
        const parameters = [];
        
        if (department || checkedIn !== undefined) {
            const conditions = [];
            if (department) {
                conditions.push("c.department = @department");
                parameters.push({ name: "@department", value: department });
            }
            if (checkedIn !== undefined) {
                conditions.push("c.checkedIn = @checkedIn");
                parameters.push({ name: "@checkedIn", value: checkedIn === 'true' });
            }
            query += " WHERE " + conditions.join(" AND ");
        }
        
        const { resources: attendees } = await container.items.query({
            query,
            parameters
        }).fetchAll();
        
        context.res = {
            status: 200,
            body: attendees,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': process.env.FRONTEND_URL
            }
        };
    } catch (error) {
        context.log.error('Error fetching attendees:', error);
        context.res = {
            status: 500,
            body: { error: 'Failed to fetch attendees' }
        };
    }
};
```

### 2. Check-in Endpoint (`/api/checkin`)

**POST** - Check in an attendee by QR code
```javascript
// checkin/index.js
module.exports = async function (context, req) {
    const { qrData } = req.body;
    
    if (!qrData) {
        context.res = {
            status: 400,
            body: { error: 'QR data is required' }
        };
        return;
    }
    
    try {
        // Decode QR data (could be attendee ID or email)
        const attendeeId = qrData;
        
        const client = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING);
        const container = client.database('EventCheckIn').container('Attendees');
        
        // Find attendee
        const { resources: attendees } = await container.items.query({
            query: "SELECT * FROM c WHERE c.id = @id OR c.email = @email",
            parameters: [
                { name: "@id", value: attendeeId },
                { name: "@email", value: attendeeId }
            ]
        }).fetchAll();
        
        if (attendees.length === 0) {
            context.res = {
                status: 404,
                body: { error: 'Attendee not found' }
            };
            return;
        }
        
        const attendee = attendees[0];
        
        if (attendee.checkedIn) {
            context.res = {
                status: 409,
                body: { 
                    error: 'Attendee already checked in',
                    attendee,
                    checkInTime: attendee.checkInTime
                }
            };
            return;
        }
        
        // Update check-in status
        attendee.checkedIn = true;
        attendee.checkInTime = new Date().toISOString();
        
        await container.item(attendee.id, attendee.email).replace(attendee);
        
        context.res = {
            status: 200,
            body: {
                success: true,
                attendee,
                message: `${attendee.firstName} ${attendee.lastName} checked in successfully`
            }
        };
        
    } catch (error) {
        context.log.error('Check-in error:', error);
        context.res = {
            status: 500,
            body: { error: 'Check-in failed' }
        };
    }
};
```

### 3. QR Code Generator (`/api/generate-qr`)

```javascript
// qr-generator/index.js
const QRCode = require('qrcode');

module.exports = async function (context, req) {
    const { attendeeId, format = 'png' } = req.body;
    
    if (!attendeeId) {
        context.res = {
            status: 400,
            body: { error: 'Attendee ID is required' }
        };
        return;
    }
    
    try {
        // Generate QR code as base64 data URL
        const qrCodeDataURL = await QRCode.toDataURL(attendeeId, {
            width: 256,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        
        context.res = {
            status: 200,
            body: {
                qrCode: qrCodeDataURL,
                attendeeId
            },
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
    } catch (error) {
        context.log.error('QR generation error:', error);
        context.res = {
            status: 500,
            body: { error: 'Failed to generate QR code' }
        };
    }
};
```

### 4. Microsoft Forms Webhook (`/api/forms-webhook`)

```javascript
// forms-webhook/index.js
const { v4: uuidv4 } = require('uuid');

module.exports = async function (context, req) {
    const formData = req.body;
    
    try {
        // Parse Microsoft Forms response
        const attendee = {
            id: uuidv4(),
            firstName: formData.firstName || formData['First Name'],
            lastName: formData.lastName || formData['Last Name'], 
            email: formData.email || formData['Email'],
            department: formData.department || formData['Department'],
            foodAllergies: formData.foodAllergies || formData['Food Allergies'] || '',
            registrationTime: new Date().toISOString(),
            checkedIn: false
        };
        
        // Save to database
        const client = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING);
        const container = client.database('EventCheckIn').container('Attendees');
        
        await container.items.create(attendee);
        
        // Generate QR code
        const qrResponse = await context.bindings.qrGenerator.post('/api/generate-qr', {
            attendeeId: attendee.id
        });
        
        // Send email with QR code
        await context.bindings.emailSender.post('/api/send-qr-email', {
            attendee,
            qrCode: qrResponse.data.qrCode
        });
        
        context.res = {
            status: 200,
            body: {
                success: true,
                attendee,
                message: 'Registration processed and QR code sent'
            }
        };
        
    } catch (error) {
        context.log.error('Webhook processing error:', error);
        context.res = {
            status: 500,
            body: { error: 'Failed to process registration' }
        };
    }
};
```

## Authentication Middleware

```javascript
// shared/auth.js
const jwt = require('jsonwebtoken');

function authenticateToken(req) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return { error: 'Access token required', status: 401 };
    }
    
    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        return { user };
    } catch (error) {
        return { error: 'Invalid token', status: 403 };
    }
}

module.exports = { authenticateToken };
```

## Error Handling and Logging

```javascript
// shared/errorHandler.js
function handleError(context, error, operation) {
    context.log.error(`Error in ${operation}:`, error);
    
    return {
        status: error.status || 500,
        body: {
            error: error.message || 'Internal server error',
            operation,
            timestamp: new Date().toISOString()
        }
    };
}

module.exports = { handleError };
```

## Local Development

```bash
# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4

# Start local development server
func start

# Test endpoints
curl http://localhost:7071/api/attendees
```

## Deployment

```bash
# Deploy to Azure
func azure functionapp publish func-event-checkin

# Set environment variables
az functionapp config appsettings set --name func-event-checkin --resource-group rg-event-checkin --settings @settings.json
```

## Monitoring and Debugging

- Use Application Insights for monitoring
- Enable detailed logging in production
- Set up alerts for failures
- Monitor performance metrics

## Next Steps

1. Implement the [Email Service](./email-service-setup.md)
2. Set up [Microsoft Forms Integration](./microsoft-forms-integration.md)
3. Configure [Frontend API Integration](./frontend-integration.md)
