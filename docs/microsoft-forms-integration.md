
# Microsoft Forms Integration Guide

This guide explains how to connect Microsoft Forms to your Azure backend for automatic attendee registration.

## Integration Options

### Option 1: Power Automate (Recommended)
- Real-time webhook triggers
- No polling required
- Built-in Microsoft ecosystem integration

### Option 2: Microsoft Graph API
- Direct API access to form responses
- Requires polling or scheduled checks
- More technical setup required

## Option 1: Power Automate Setup

### Step 1: Create Microsoft Form

1. Go to [Microsoft Forms](https://forms.microsoft.com)
2. Create a new form with these fields:
   - **First Name** (Text, Required)
   - **Last Name** (Text, Required)
   - **Email** (Text, Required)
   - **Department** (Choice: Engineering, Marketing, Sales, HR, Finance, Operations)
   - **Food Allergies** (Text, Optional)

### Step 2: Create Power Automate Flow

1. Go to [Power Automate](https://powerautomate.microsoft.com)
2. Click "Create" → "Automated cloud flow"
3. Name: "Event Registration Webhook"
4. Trigger: "When a new response is submitted" (Microsoft Forms)

### Step 3: Configure Flow Steps

```
Trigger: When a new response is submitted
↓
Action: Get response details
↓
Action: HTTP POST to Azure Function
```

#### HTTP Action Configuration:
```json
{
  "method": "POST",
  "uri": "https://func-event-checkin.azurewebsites.net/api/forms-webhook",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY"
  },
  "body": {
    "responseId": "@{triggerBody()?['responseId']}",
    "firstName": "@{body('Get_response_details')?['r1c1d2f8e9a']}",
    "lastName": "@{body('Get_response_details')?['r2c1d2f8e9a']}",
    "email": "@{body('Get_response_details')?['r3c1d2f8e9a']}",
    "department": "@{body('Get_response_details')?['r4c1d2f8e9a']}",
    "foodAllergies": "@{body('Get_response_details')?['r5c1d2f8e9a']}",
    "submissionTime": "@{utcNow()}"
  }
}
```

*Note: The field IDs (r1c1d2f8e9a, etc.) will be different for your form. Use the dynamic content picker to select the correct fields.*

### Step 4: Test the Integration

1. Submit a test response to your form
2. Check the Power Automate run history
3. Verify the Azure Function received the data
4. Confirm the attendee was created in your database

## Option 2: Microsoft Graph API Setup

### Step 1: Get Form ID

1. Open your Microsoft Form
2. Click "Share" → "Get a link to view and edit"
3. Extract the form ID from the URL:
   ```
   https://forms.office.com/Pages/DesignPageV2.aspx?subpage=design&FormId=YOUR_FORM_ID
   ```

### Step 2: Azure Function for Polling

```javascript
// forms-poller/index.js
const { Client } = require('@microsoft/microsoft-graph-client');
const { AuthenticationProvider } = require('@azure/msal-node');

module.exports = async function (context, myTimer) {
    const graphClient = Client.initWithMiddleware({
        authProvider: {
            getAccessToken: async () => {
                // Implement Azure AD authentication
                return await getAccessToken();
            }
        }
    });

    try {
        const formId = process.env.MICROSOFT_FORM_ID;
        
        // Get form responses
        const responses = await graphClient
            .api(`/me/drive/items/${formId}/workbook/worksheets('Form Responses 1')/usedRange`)
            .get();

        // Process new responses
        const newResponses = await processResponses(responses.values);
        
        for (const response of newResponses) {
            await processRegistration(response);
        }
        
        context.log(`Processed ${newResponses.length} new registrations`);
        
    } catch (error) {
        context.log.error('Error polling forms:', error);
    }
};

async function processResponses(rows) {
    // Skip header row and process data
    const dataRows = rows.slice(1);
    
    return dataRows.map(row => ({
        timestamp: row[0],
        firstName: row[1],
        lastName: row[2],
        email: row[3],
        department: row[4],
        foodAllergies: row[5] || ''
    }));
}
```

### Step 3: Schedule the Poller

```json
{
  "bindings": [
    {
      "name": "myTimer",
      "type": "timerTrigger",
      "direction": "in",
      "schedule": "0 */5 * * * *"
    }
  ]
}
```

## Data Mapping

### Form Field Mapping
```javascript
const fieldMapping = {
    'First Name': 'firstName',
    'Last Name': 'lastName',
    'Email': 'email',
    'Department': 'department',
    'Food Allergies': 'foodAllergies'
};

function mapFormData(formResponse) {
    const attendee = {};
    
    for (const [formField, dbField] of Object.entries(fieldMapping)) {
        attendee[dbField] = formResponse[formField] || '';
    }
    
    // Add system fields
    attendee.id = generateUniqueId();
    attendee.registrationTime = new Date().toISOString();
    attendee.checkedIn = false;
    
    return attendee;
}
```

## Error Handling

### Power Automate Error Handling
1. Add "Configure run after" settings
2. Set up email notifications for failures
3. Add retry logic for HTTP requests

### Graph API Error Handling
```javascript
async function retryGraphRequest(operation, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            
            // Exponential backoff
            await new Promise(resolve => 
                setTimeout(resolve, Math.pow(2, i) * 1000)
            );
        }
    }
}
```

## Security Considerations

### API Key Management
```javascript
// Validate API key in webhook endpoint
function validateApiKey(req) {
    const authHeader = req.headers.authorization;
    const providedKey = authHeader?.replace('Bearer ', '');
    
    return providedKey === process.env.WEBHOOK_API_KEY;
}
```

### Rate Limiting
```javascript
const rateLimit = new Map();

function checkRateLimit(clientId) {
    const now = Date.now();
    const windowStart = now - (60 * 1000); // 1 minute window
    
    const requests = rateLimit.get(clientId) || [];
    const recentRequests = requests.filter(time => time > windowStart);
    
    if (recentRequests.length >= 10) { // 10 requests per minute
        return false;
    }
    
    recentRequests.push(now);
    rateLimit.set(clientId, recentRequests);
    return true;
}
```

## Testing and Validation

### Test Data Structure
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@company.com",
  "department": "Engineering",
  "foodAllergies": "None",
  "submissionTime": "2024-01-15T10:30:00Z"
}
```

### Validation Script
```javascript
function validateRegistrationData(data) {
    const errors = [];
    
    if (!data.firstName?.trim()) errors.push('First name is required');
    if (!data.lastName?.trim()) errors.push('Last name is required');
    if (!isValidEmail(data.email)) errors.push('Valid email is required');
    if (!data.department) errors.push('Department is required');
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
```

## Monitoring and Troubleshooting

### Power Automate Monitoring
- Check run history for failed flows
- Review trigger conditions
- Validate HTTP response codes

### Logs and Metrics
```javascript
// Add detailed logging
context.log('Registration received:', {
    email: data.email,
    timestamp: new Date().toISOString(),
    source: 'microsoft-forms'
});

// Track metrics
context.log.metric('registrations_processed', 1, {
    source: 'microsoft-forms',
    department: data.department
});
```

## Next Steps

1. Set up [Email Service](./email-service-setup.md) for QR code delivery
2. Configure [Frontend Integration](./frontend-integration.md)
3. Test the complete registration flow
4. Set up monitoring and alerts
