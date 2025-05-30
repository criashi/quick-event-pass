
# Testing Guide

This guide covers end-to-end testing of the QR code-based event check-in system.

## Testing Overview

We'll test the complete flow:
1. Microsoft Forms registration
2. Automated email with QR code
3. QR code scanning and check-in
4. Admin dashboard functionality
5. Data integrity and security

## Prerequisites

- Deployed Azure infrastructure
- Test Microsoft Form created
- Test email account
- Mobile device or QR code reader app

## Test Data Setup

### Create Test Attendees

```javascript
// test-data/attendees.js
const testAttendees = [
  {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe.test@company.com",
    department: "Engineering",
    foodAllergies: "None"
  },
  {
    firstName: "Jane",
    lastName: "Smith", 
    email: "jane.smith.test@company.com",
    department: "Marketing",
    foodAllergies: "Nuts, Dairy"
  },
  {
    firstName: "Mike",
    lastName: "Johnson",
    email: "mike.johnson.test@company.com",
    department: "Sales",
    foodAllergies: ""
  }
];

module.exports = { testAttendees };
```

### Test Environment Variables

```bash
# test.env
API_BASE_URL=https://func-event-checkin.azurewebsites.net/api
FRONTEND_URL=https://swa-event-checkin.azurestaticapps.net
TEST_EMAIL=your-test-email@company.com
WEBHOOK_API_KEY=your-test-webhook-key
```

## Unit Tests

### API Endpoint Tests

```javascript
// tests/api.test.js
const axios = require('axios');
const { testAttendees } = require('../test-data/attendees');

const API_BASE_URL = process.env.API_BASE_URL;

describe('API Endpoints', () => {
  test('GET /attendees returns attendee list', async () => {
    const response = await axios.get(`${API_BASE_URL}/attendees`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBeGreaterThanOrEqual(0);
  });

  test('POST /checkin validates QR data', async () => {
    const invalidQrData = { qrData: 'invalid-qr-code' };
    
    try {
      await axios.post(`${API_BASE_URL}/checkin`, invalidQrData);
    } catch (error) {
      expect(error.response.status).toBe(404);
      expect(error.response.data.error).toContain('Attendee not found');
    }
  });

  test('POST /forms-webhook creates attendee', async () => {
    const testAttendee = testAttendees[0];
    
    const response = await axios.post(
      `${API_BASE_URL}/forms-webhook`,
      testAttendee,
      {
        headers: {
          'Authorization': `Bearer ${process.env.WEBHOOK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.attendee.email).toBe(testAttendee.email);
  });

  test('POST /generate-qr creates QR code', async () => {
    const response = await axios.post(`${API_BASE_URL}/generate-qr`, {
      attendeeId: 'test-attendee-123'
    });
    
    expect(response.status).toBe(200);
    expect(response.data.qrCode).toMatch(/^data:image\/png;base64,/);
  });
});
```

### Database Tests

```javascript
// tests/database.test.js
const { CosmosClient } = require('@azure/cosmos');

const client = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING);
const container = client.database('EventCheckIn').container('Attendees');

describe('Database Operations', () => {
  let testAttendeeId;

  beforeEach(async () => {
    // Create test attendee
    const testAttendee = {
      id: `test-${Date.now()}`,
      firstName: 'Test',
      lastName: 'User',
      email: `test-${Date.now()}@example.com`,
      department: 'Testing',
      registrationTime: new Date().toISOString(),
      checkedIn: false
    };
    
    await container.items.create(testAttendee);
    testAttendeeId = testAttendee.id;
  });

  afterEach(async () => {
    // Clean up test data
    try {
      const { resource: attendee } = await container.item(testAttendeeId).read();
      await container.item(testAttendeeId, attendee.email).delete();
    } catch (error) {
      // Attendee might already be deleted
    }
  });

  test('Create attendee record', async () => {
    const { resource: attendee } = await container.item(testAttendeeId).read();
    
    expect(attendee).toBeDefined();
    expect(attendee.firstName).toBe('Test');
    expect(attendee.checkedIn).toBe(false);
  });

  test('Update check-in status', async () => {
    const { resource: attendee } = await container.item(testAttendeeId).read();
    attendee.checkedIn = true;
    attendee.checkInTime = new Date().toISOString();
    
    await container.item(testAttendeeId, attendee.email).replace(attendee);
    
    const { resource: updatedAttendee } = await container.item(testAttendeeId).read();
    expect(updatedAttendee.checkedIn).toBe(true);
    expect(updatedAttendee.checkInTime).toBeDefined();
  });
});
```

## Integration Tests

### Microsoft Forms Integration Test

```javascript
// tests/forms-integration.test.js
const axios = require('axios');

describe('Microsoft Forms Integration', () => {
  test('Form submission triggers webhook', async () => {
    // Simulate Microsoft Forms webhook payload
    const formSubmission = {
      firstName: 'Integration',
      lastName: 'Test',
      email: 'integration.test@company.com',
      department: 'QA',
      foodAllergies: 'Shellfish',
      submissionTime: new Date().toISOString()
    };

    const response = await axios.post(
      `${process.env.API_BASE_URL}/forms-webhook`,
      formSubmission,
      {
        headers: {
          'Authorization': `Bearer ${process.env.WEBHOOK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    
    // Verify attendee was created
    const attendeesResponse = await axios.get(`${process.env.API_BASE_URL}/attendees`);
    const createdAttendee = attendeesResponse.data.find(
      a => a.email === formSubmission.email
    );
    
    expect(createdAttendee).toBeDefined();
    expect(createdAttendee.firstName).toBe('Integration');
  });
});
```

### Email Service Test

```javascript
// tests/email.test.js
const axios = require('axios');

describe('Email Service', () => {
  test('Send QR code email', async () => {
    const testAttendee = {
      id: 'email-test-123',
      firstName: 'Email',
      lastName: 'Test',
      email: process.env.TEST_EMAIL,
      department: 'Testing'
    };

    const eventDetails = {
      eventName: 'Test Event',
      eventDate: '2024-02-15',
      eventTime: '10:00 AM',
      eventLocation: 'Test Venue'
    };

    const response = await axios.post(
      `${process.env.API_BASE_URL}/send-qr-email`,
      {
        attendee: testAttendee,
        eventDetails: eventDetails
      }
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.message).toContain(testAttendee.email);
  });
});
```

## End-to-End Tests

### Complete Registration Flow Test

```javascript
// tests/e2e-registration.test.js
const axios = require('axios');

describe('End-to-End Registration Flow', () => {
  let attendeeId;
  let qrCode;

  test('Complete registration to check-in flow', async () => {
    // Step 1: Register attendee via webhook
    const registrationData = {
      firstName: 'E2E',
      lastName: 'Test',
      email: 'e2e.test@company.com',
      department: 'Engineering',
      foodAllergies: 'None'
    };

    const registrationResponse = await axios.post(
      `${process.env.API_BASE_URL}/forms-webhook`,
      registrationData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.WEBHOOK_API_KEY}`
        }
      }
    );

    expect(registrationResponse.status).toBe(200);
    attendeeId = registrationResponse.data.attendee.id;

    // Step 2: Generate QR code
    const qrResponse = await axios.post(
      `${process.env.API_BASE_URL}/generate-qr`,
      { attendeeId: attendeeId }
    );

    expect(qrResponse.status).toBe(200);
    qrCode = qrResponse.data.qrCode;
    expect(qrCode).toMatch(/^data:image\/png;base64,/);

    // Step 3: Verify attendee exists and is not checked in
    const attendeesResponse = await axios.get(
      `${process.env.API_BASE_URL}/attendees`
    );
    
    const attendee = attendeesResponse.data.find(a => a.id === attendeeId);
    expect(attendee).toBeDefined();
    expect(attendee.checkedIn).toBe(false);

    // Step 4: Check in using QR code
    const checkinResponse = await axios.post(
      `${process.env.API_BASE_URL}/checkin`,
      { qrData: attendeeId }
    );

    expect(checkinResponse.status).toBe(200);
    expect(checkinResponse.data.success).toBe(true);
    expect(checkinResponse.data.attendee.checkedIn).toBe(true);

    // Step 5: Verify check-in status updated
    const updatedAttendeesResponse = await axios.get(
      `${process.env.API_BASE_URL}/attendees`
    );
    
    const checkedInAttendee = updatedAttendeesResponse.data.find(
      a => a.id === attendeeId
    );
    
    expect(checkedInAttendee.checkedIn).toBe(true);
    expect(checkedInAttendee.checkInTime).toBeDefined();
  });
});
```

## Frontend Tests

### React Component Tests

```javascript
// src/tests/Dashboard.test.tsx
import { render, screen } from '@testing-library/react';
import Dashboard from '../components/Dashboard';

const mockAttendees = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@test.com',
    department: 'Engineering',
    checkedIn: true,
    registrationTime: '2024-01-15T10:00:00Z',
    checkInTime: '2024-01-16T09:00:00Z'
  }
];

const mockStats = {
  total: 1,
  checkedIn: 1,
  pending: 0
};

test('renders dashboard with attendee stats', () => {
  render(<Dashboard attendees={mockAttendees} stats={mockStats} />);
  
  expect(screen.getByText('1')).toBeInTheDocument(); // total count
  expect(screen.getByText('John Doe')).toBeInTheDocument();
  expect(screen.getByText('Engineering')).toBeInTheDocument();
});
```

### QR Scanner Tests

```javascript
// src/tests/QRScanner.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import QRScanner from '../components/QRScanner';

const mockOnCheckIn = jest.fn();
const mockAttendees = [
  {
    id: 'test-123',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@test.com',
    department: 'Testing',
    checkedIn: false,
    registrationTime: '2024-01-15T10:00:00Z'
  }
];

test('handles successful check-in', () => {
  render(<QRScanner onCheckIn={mockOnCheckIn} attendees={mockAttendees} />);
  
  const input = screen.getByPlaceholderText(/Enter QR code/i);
  fireEvent.change(input, { target: { value: 'test-123' } });
  
  const checkInButton = screen.getByText(/Check In/i);
  fireEvent.click(checkInButton);
  
  expect(mockOnCheckIn).toHaveBeenCalledWith('test-123');
});
```

## Manual Testing Checklist

### Registration Flow
- [ ] Submit Microsoft Form with valid data
- [ ] Receive confirmation email with QR code
- [ ] QR code image is clear and scannable
- [ ] Email content is properly formatted
- [ ] Attendee appears in admin dashboard

### Check-in Flow
- [ ] Scan QR code with mobile device
- [ ] Admin portal shows successful check-in
- [ ] Timestamp is recorded correctly
- [ ] Status updates in real-time
- [ ] Cannot check in twice (duplicate prevention)

### Admin Dashboard
- [ ] Dashboard loads without errors
- [ ] Stats display correctly
- [ ] Attendee list is searchable and filterable
- [ ] Export functionality works
- [ ] Real-time updates work

### Error Handling
- [ ] Invalid QR codes show appropriate errors
- [ ] Network errors are handled gracefully
- [ ] Form validation works properly
- [ ] API rate limiting works
- [ ] Database connection errors are handled

## Load Testing

### API Load Test

```javascript
// tests/load.test.js
const axios = require('axios');

async function loadTest() {
  const concurrentRequests = 50;
  const promises = [];

  for (let i = 0; i < concurrentRequests; i++) {
    promises.push(
      axios.get(`${process.env.API_BASE_URL}/attendees`)
        .catch(error => ({ error: error.message }))
    );
  }

  const results = await Promise.all(promises);
  const successful = results.filter(r => !r.error).length;
  const failed = results.filter(r => r.error).length;

  console.log(`Load test results: ${successful} successful, ${failed} failed`);
  expect(successful).toBeGreaterThan(concurrentRequests * 0.95); // 95% success rate
}

test('API handles concurrent requests', async () => {
  await loadTest();
}, 30000); // 30 second timeout
```

## Security Testing

### Authentication Tests

```javascript
// tests/security.test.js
const axios = require('axios');

describe('Security Tests', () => {
  test('API requires authentication', async () => {
    try {
      await axios.post(`${process.env.API_BASE_URL}/checkin`, {
        qrData: 'test'
      });
    } catch (error) {
      expect(error.response.status).toBe(401);
    }
  });

  test('Invalid API key is rejected', async () => {
    try {
      await axios.post(
        `${process.env.API_BASE_URL}/forms-webhook`,
        { email: 'test@test.com' },
        {
          headers: {
            'Authorization': 'Bearer invalid-key'
          }
        }
      );
    } catch (error) {
      expect(error.response.status).toBe(403);
    }
  });
});
```

## Performance Testing

### Response Time Tests

```javascript
// tests/performance.test.js
const axios = require('axios');

describe('Performance Tests', () => {
  test('API responses within acceptable time', async () => {
    const start = Date.now();
    await axios.get(`${process.env.API_BASE_URL}/attendees`);
    const responseTime = Date.now() - start;
    
    expect(responseTime).toBeLessThan(2000); // 2 seconds max
  });

  test('QR generation is fast', async () => {
    const start = Date.now();
    await axios.post(`${process.env.API_BASE_URL}/generate-qr`, {
      attendeeId: 'perf-test-123'
    });
    const responseTime = Date.now() - start;
    
    expect(responseTime).toBeLessThan(5000); // 5 seconds max
  });
});
```

## Test Data Cleanup

```javascript
// scripts/cleanup-test-data.js
const { CosmosClient } = require('@azure/cosmos');

async function cleanupTestData() {
  const client = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING);
  const container = client.database('EventCheckIn').container('Attendees');
  
  const { resources: testAttendees } = await container.items.query({
    query: "SELECT * FROM c WHERE CONTAINS(c.email, 'test') OR CONTAINS(c.email, 'e2e')"
  }).fetchAll();
  
  for (const attendee of testAttendees) {
    await container.item(attendee.id, attendee.email).delete();
    console.log(`Deleted test attendee: ${attendee.email}`);
  }
  
  console.log(`Cleaned up ${testAttendees.length} test records`);
}

if (require.main === module) {
  cleanupTestData().catch(console.error);
}
```

## Running Tests

```bash
# Install test dependencies
npm install --save-dev jest axios @testing-library/react @testing-library/jest-dom

# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Run all tests with coverage
npm run test:coverage

# Run specific test suite
npm test -- --testNamePattern="Registration Flow"
```

## Continuous Integration

```yaml
# .github/workflows/test.yml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm test
      
    - name: Run integration tests
      run: npm run test:integration
      env:
        API_BASE_URL: ${{ secrets.TEST_API_BASE_URL }}
        WEBHOOK_API_KEY: ${{ secrets.TEST_WEBHOOK_API_KEY }}
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

This comprehensive testing guide ensures your QR code-based event check-in system is thoroughly validated before production deployment.
