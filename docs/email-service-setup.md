
# Email Service Setup Guide

This guide covers setting up automated email delivery with QR codes using Microsoft Graph API and Azure Functions.

## Overview

The email service will:
- Generate QR codes for each attendee
- Send personalized emails with embedded QR codes
- Include event instructions and details
- Handle email delivery failures and retries

## Prerequisites

- Azure AD app registration with Mail.Send permissions
- Microsoft 365 subscription or Exchange Online
- Azure Functions backend setup completed

## Microsoft Graph API Setup

### Step 1: Configure App Registration Permissions

1. Go to Azure Portal → Azure Active Directory → App registrations
2. Select your app registration
3. Go to "API permissions" → "Add a permission"
4. Select "Microsoft Graph" → "Application permissions"
5. Add these permissions:
   - `Mail.Send`
   - `Mail.ReadWrite` (optional, for sent items access)
   - `User.Read.All` (if sending from shared mailbox)

6. Click "Grant admin consent"

### Step 2: Certificate Authentication (Recommended)

```bash
# Generate certificate
openssl req -x509 -newkey rsa:2048 -keyout private.key -out certificate.crt -days 365 -nodes

# Upload certificate to Azure AD app registration
# Go to "Certificates & secrets" → "Certificates" → "Upload certificate"
```

## Email Function Implementation

### Azure Function: Send QR Email

```javascript
// email-sender/index.js
const { Client } = require('@microsoft/microsoft-graph-client');
const { AuthenticationProvider } = require('@azure/msal-node');
const QRCode = require('qrcode');

const clientConfig = {
    auth: {
        clientId: process.env.AZURE_CLIENT_ID,
        clientSecret: process.env.AZURE_CLIENT_SECRET,
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`
    }
};

module.exports = async function (context, req) {
    const { attendee, eventDetails } = req.body;
    
    if (!attendee?.email) {
        context.res = {
            status: 400,
            body: { error: 'Attendee email is required' }
        };
        return;
    }
    
    try {
        // Initialize Graph client
        const graphClient = await initializeGraphClient();
        
        // Generate QR code
        const qrCodeBase64 = await generateQRCode(attendee.id);
        
        // Create email content
        const emailContent = createEmailTemplate(attendee, qrCodeBase64, eventDetails);
        
        // Send email
        await sendEmail(graphClient, attendee.email, emailContent);
        
        context.res = {
            status: 200,
            body: {
                success: true,
                message: `QR code email sent to ${attendee.email}`
            }
        };
        
    } catch (error) {
        context.log.error('Email sending error:', error);
        context.res = {
            status: 500,
            body: { error: 'Failed to send email' }
        };
    }
};

async function initializeGraphClient() {
    const clientCredentialRequest = {
        scopes: ['https://graph.microsoft.com/.default'],
    };
    
    const pca = new ConfidentialClientApplication(clientConfig);
    const response = await pca.acquireTokenByClientCredential(clientCredentialRequest);
    
    return Client.init({
        authProvider: {
            getAccessToken: async () => response.accessToken
        }
    });
}

async function generateQRCode(attendeeId) {
    try {
        const qrDataURL = await QRCode.toDataURL(attendeeId, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        
        // Extract base64 data
        return qrDataURL.split(',')[1];
    } catch (error) {
        throw new Error(`QR code generation failed: ${error.message}`);
    }
}

function createEmailTemplate(attendee, qrCodeBase64, eventDetails = {}) {
    const {
        eventName = 'Company Event',
        eventDate = 'TBD',
        eventLocation = 'Company Headquarters',
        eventTime = 'TBD'
    } = eventDetails;
    
    return {
        subject: `Your QR Code for ${eventName}`,
        body: {
            contentType: 'HTML',
            content: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .qr-container { text-align: center; margin: 30px 0; }
                        .qr-code { border: 3px solid #667eea; border-radius: 10px; padding: 20px; background: white; display: inline-block; }
                        .event-details { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; }
                        .highlight { color: #667eea; font-weight: bold; }
                        .instructions { background: #e3f2fd; padding: 20px; border-radius: 10px; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 You're Registered!</h1>
                            <p>Welcome to ${eventName}</p>
                        </div>
                        
                        <div class="content">
                            <p>Hi <span class="highlight">${attendee.firstName} ${attendee.lastName}</span>,</p>
                            
                            <p>Thank you for registering for <strong>${eventName}</strong>! We're excited to see you there.</p>
                            
                            <div class="event-details">
                                <h3>📅 Event Details</h3>
                                <p><strong>Date:</strong> ${eventDate}</p>
                                <p><strong>Time:</strong> ${eventTime}</p>
                                <p><strong>Location:</strong> ${eventLocation}</p>
                                <p><strong>Department:</strong> ${attendee.department}</p>
                                ${attendee.foodAllergies ? `<p><strong>Food Allergies:</strong> ${attendee.foodAllergies}</p>` : ''}
                            </div>
                            
                            <div class="qr-container">
                                <h3>📱 Your Check-in QR Code</h3>
                                <div class="qr-code">
                                    <img src="data:image/png;base64,${qrCodeBase64}" alt="QR Code" style="width: 200px; height: 200px;">
                                </div>
                            </div>
                            
                            <div class="instructions">
                                <h3>📋 Check-in Instructions</h3>
                                <ol>
                                    <li>Save this email or take a screenshot of the QR code</li>
                                    <li>Arrive at the event location</li>
                                    <li>Present your QR code at the check-in station</li>
                                    <li>Our staff will scan it for instant check-in</li>
                                </ol>
                                <p><strong>Note:</strong> You can also show this QR code on your phone screen.</p>
                            </div>
                            
                            <p>If you have any questions, please contact the event organizers.</p>
                            
                            <p>See you at the event!<br>
                            <strong>The Event Team</strong></p>
                        </div>
                        
                        <div class="footer">
                            <p>This is an automated message. Please do not reply to this email.</p>
                            <p>Event ID: ${attendee.id}</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        },
        attachments: [
            {
                '@odata.type': '#microsoft.graph.fileAttachment',
                name: 'qr-code.png',
                contentType: 'image/png',
                contentBytes: qrCodeBase64
            }
        ]
    };
}

async function sendEmail(graphClient, recipientEmail, emailContent) {
    const sendMailRequest = {
        message: {
            subject: emailContent.subject,
            body: emailContent.body,
            toRecipients: [
                {
                    emailAddress: {
                        address: recipientEmail
                    }
                }
            ],
            attachments: emailContent.attachments
        },
        saveToSentItems: true
    };
    
    await graphClient.api('/me/sendMail').post(sendMailRequest);
}
```

## Email Templates

### Basic Template Configuration

```javascript
// shared/emailTemplates.js
const templates = {
    registration: {
        subject: 'Your QR Code for {eventName}',
        template: 'registration-confirmation.html'
    },
    reminder: {
        subject: 'Event Reminder: {eventName} Tomorrow',
        template: 'event-reminder.html'
    },
    checkInConfirmation: {
        subject: 'Check-in Confirmed for {eventName}',
        template: 'checkin-confirmation.html'
    }
};

function getTemplate(templateName, variables) {
    const template = templates[templateName];
    if (!template) {
        throw new Error(`Template ${templateName} not found`);
    }
    
    let content = readTemplateFile(template.template);
    let subject = template.subject;
    
    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{${key}}`;
        content = content.replace(new RegExp(placeholder, 'g'), value);
        subject = subject.replace(new RegExp(placeholder, 'g'), value);
    }
    
    return { subject, content };
}

module.exports = { getTemplate, templates };
```

## Batch Email Processing

```javascript
// email-batch-sender/index.js
module.exports = async function (context, req) {
    const { attendees, eventDetails } = req.body;
    
    if (!Array.isArray(attendees) || attendees.length === 0) {
        context.res = {
            status: 400,
            body: { error: 'Attendees array is required' }
        };
        return;
    }
    
    const results = {
        sent: [],
        failed: [],
        total: attendees.length
    };
    
    // Process in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < attendees.length; i += batchSize) {
        const batch = attendees.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (attendee) => {
            try {
                await sendQREmail(attendee, eventDetails);
                results.sent.push(attendee.email);
                return { success: true, email: attendee.email };
            } catch (error) {
                context.log.error(`Failed to send email to ${attendee.email}:`, error);
                results.failed.push({
                    email: attendee.email,
                    error: error.message
                });
                return { success: false, email: attendee.email, error: error.message };
            }
        });
        
        await Promise.allSettled(batchPromises);
        
        // Rate limiting delay
        if (i + batchSize < attendees.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    context.res = {
        status: 200,
        body: {
            success: true,
            results,
            message: `Sent ${results.sent.length}/${results.total} emails successfully`
        }
    };
};
```

## Error Handling and Retries

```javascript
// shared/emailRetry.js
async function sendEmailWithRetry(graphClient, recipient, emailContent, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await sendEmail(graphClient, recipient, emailContent);
            return { success: true, attempts: attempt };
        } catch (error) {
            const isLastAttempt = attempt === maxRetries;
            const shouldRetry = isRetryableError(error);
            
            if (isLastAttempt || !shouldRetry) {
                throw error;
            }
            
            // Exponential backoff
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

function isRetryableError(error) {
    const retryableStatusCodes = [429, 502, 503, 504];
    const retryableErrorCodes = [
        'TooManyRequests',
        'ServiceUnavailable',
        'Timeout'
    ];
    
    return retryableStatusCodes.includes(error.statusCode) ||
           retryableErrorCodes.some(code => error.message?.includes(code));
}

module.exports = { sendEmailWithRetry };
```

## Testing and Validation

### Test Email Function

```javascript
// test-email/index.js
module.exports = async function (context, req) {
    const testAttendee = {
        id: 'test-12345',
        firstName: 'Test',
        lastName: 'User',
        email: req.body.testEmail || 'test@example.com',
        department: 'Testing',
        foodAllergies: 'None'
    };
    
    const testEventDetails = {
        eventName: 'Test Event',
        eventDate: 'Today',
        eventTime: 'Now',
        eventLocation: 'Test Location'
    };
    
    try {
        await sendQREmail(testAttendee, testEventDetails);
        
        context.res = {
            status: 200,
            body: {
                success: true,
                message: `Test email sent to ${testAttendee.email}`
            }
        };
    } catch (error) {
        context.log.error('Test email failed:', error);
        context.res = {
            status: 500,
            body: { error: 'Test email failed', details: error.message }
        };
    }
};
```

## Monitoring and Analytics

### Email Delivery Tracking

```javascript
// Track email metrics
function trackEmailEvent(eventType, attendeeId, email, metadata = {}) {
    context.log.metric(`email_${eventType}`, 1, {
        attendeeId,
        email: hashEmail(email), // Hash for privacy
        ...metadata
    });
}

// Usage examples:
trackEmailEvent('sent', attendee.id, attendee.email, { department: attendee.department });
trackEmailEvent('failed', attendee.id, attendee.email, { error: error.message });
trackEmailEvent('retry', attendee.id, attendee.email, { attempt: attemptNumber });
```

## Security Best Practices

### Email Content Security
- Sanitize all user input before including in emails
- Use parameterized templates
- Validate email addresses
- Implement rate limiting

### Authentication Security
```javascript
// Secure credential handling
const credentials = {
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET, // Use Key Vault in production
    tenantId: process.env.AZURE_TENANT_ID
};

// Validate environment variables
function validateConfig() {
    const required = ['AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET', 'AZURE_TENANT_ID'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
```

## Next Steps

1. Test email delivery with sample data
2. Configure [Frontend Integration](./frontend-integration.md)
3. Set up monitoring and alerts
4. Implement the complete [Deployment](./deployment.md) process
