
# Deployment Guide

This guide covers deploying the complete QR code-based event check-in system to Azure.

## Deployment Overview

The system consists of:
1. **Frontend**: React app → Azure Static Web Apps
2. **Backend**: Azure Functions → Function App
3. **Database**: Cosmos DB or Table Storage
4. **Email Service**: Microsoft Graph API integration
5. **Form Integration**: Power Automate or Graph API

## Prerequisites

- Azure CLI installed and logged in
- GitHub repository (optional, for CI/CD)
- Domain name (optional, for custom domain)

## Step 1: Infrastructure Deployment

### Automated Deployment Script

```bash
#!/bin/bash
# deploy-infrastructure.sh

# Variables
RESOURCE_GROUP="rg-event-checkin"
LOCATION="East US"
APP_NAME="event-checkin"
STORAGE_ACCOUNT="st${APP_NAME}$(date +%s)"
FUNCTION_APP="func-${APP_NAME}"
COSMOS_ACCOUNT="cosmos-${APP_NAME}"
STATIC_WEB_APP="swa-${APP_NAME}"

echo "🚀 Starting Azure deployment for Event Check-in System..."

# Create resource group
echo "📦 Creating resource group..."
az group create --name $RESOURCE_GROUP --location "$LOCATION"

# Create storage account
echo "💾 Creating storage account..."
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location "$LOCATION" \
  --sku Standard_LRS \
  --kind StorageV2

# Create Cosmos DB
echo "🗄️ Creating Cosmos DB..."
az cosmosdb create \
  --name $COSMOS_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --default-consistency-level Session \
  --locations regionName="$LOCATION" failoverPriority=0 isZoneRedundant=False

# Create database and container
az cosmosdb sql database create \
  --account-name $COSMOS_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --name EventCheckIn

az cosmosdb sql container create \
  --account-name $COSMOS_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --database-name EventCheckIn \
  --name Attendees \
  --partition-key-path "/email" \
  --throughput 400

# Create Function App
echo "⚡ Creating Azure Functions..."
az functionapp create \
  --resource-group $RESOURCE_GROUP \
  --consumption-plan-location "$LOCATION" \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --name $FUNCTION_APP \
  --storage-account $STORAGE_ACCOUNT \
  --disable-app-insights false

# Create Static Web App
echo "🌐 Creating Static Web App..."
az staticwebapp create \
  --name $STATIC_WEB_APP \
  --resource-group $RESOURCE_GROUP \
  --location "East US 2"

echo "✅ Infrastructure deployment completed!"
echo "📝 Save these values for configuration:"
echo "Resource Group: $RESOURCE_GROUP"
echo "Function App: $FUNCTION_APP"
echo "Static Web App: $STATIC_WEB_APP"
echo "Cosmos DB: $COSMOS_ACCOUNT"
echo "Storage Account: $STORAGE_ACCOUNT"
```

### Manual Deployment Steps

If you prefer manual deployment:

```bash
# Set variables
export RESOURCE_GROUP="rg-event-checkin"
export LOCATION="East US"

# Create resources one by one
az group create --name $RESOURCE_GROUP --location "$LOCATION"

# Follow the individual commands from the script above
```

## Step 2: Backend Deployment

### Function App Project Structure

```
azure-functions/
├── .funcignore
├── .gitignore
├── host.json
├── package.json
├── attendees/
│   ├── function.json
│   └── index.js
├── checkin/
│   ├── function.json
│   └── index.js
├── email-sender/
│   ├── function.json
│   └── index.js
├── forms-webhook/
│   ├── function.json
│   └── index.js
└── shared/
    ├── database.js
    ├── auth.js
    └── utils.js
```

### Deploy Functions

```bash
# Navigate to functions directory
cd azure-functions

# Install dependencies
npm install

# Deploy to Azure
func azure functionapp publish func-event-checkin --build remote

# Set application settings
az functionapp config appsettings set \
  --name func-event-checkin \
  --resource-group rg-event-checkin \
  --settings @appsettings.json
```

### Application Settings (appsettings.json)

```json
{
  "COSMOS_DB_CONNECTION_STRING": "AccountEndpoint=https://cosmos-event-checkin.documents.azure.com:443/;AccountKey=YOUR_KEY;",
  "AZURE_CLIENT_ID": "your-azure-ad-client-id",
  "AZURE_CLIENT_SECRET": "your-azure-ad-client-secret",
  "AZURE_TENANT_ID": "your-azure-tenant-id",
  "JWT_SECRET": "your-jwt-secret-key",
  "WEBHOOK_API_KEY": "your-webhook-api-key",
  "FRONTEND_URL": "https://your-static-web-app.azurestaticapps.net",
  "WEBSITE_NODE_DEFAULT_VERSION": "~18",
  "FUNCTIONS_WORKER_RUNTIME": "node",
  "AzureWebJobsFeatureFlags": "EnableWorkerIndexing"
}
```

## Step 3: Frontend Deployment

### Build Configuration

```javascript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  define: {
    'process.env.VITE_API_BASE_URL': JSON.stringify(
      process.env.VITE_API_BASE_URL || 'https://func-event-checkin.azurewebsites.net/api'
    )
  }
})
```

### Static Web Apps Configuration

```json
// staticwebapp.config.json
{
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["authenticated"]
    },
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/api/*", "/*.{css,scss,js,png,gif,ico,jpg,svg}"]
  },
  "mimeTypes": {
    ".json": "text/json"
  },
  "auth": {
    "identityProviders": {
      "azureActiveDirectory": {
        "registration": {
          "openIdIssuer": "https://login.microsoftonline.com/YOUR_TENANT_ID/v2.0",
          "clientIdSettingName": "AZURE_CLIENT_ID",
          "clientSecretSettingName": "AZURE_CLIENT_SECRET"
        }
      }
    }
  }
}
```

### Deploy Frontend

```bash
# Build the React app
npm run build

# Deploy to Static Web Apps
az staticwebapp environment set \
  --name swa-event-checkin \
  --environment-name default \
  --source ./dist
```

### GitHub Actions Deployment (Recommended)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Azure

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
      with:
        submodules: true

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build frontend
      run: npm run build
      env:
        VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}

    - name: Deploy to Azure Static Web Apps
      uses: Azure/static-web-apps-deploy@v1
      with:
        azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
        repo_token: ${{ secrets.GITHUB_TOKEN }}
        action: "upload"
        app_location: "/"
        output_location: "dist"

    - name: Deploy Azure Functions
      uses: Azure/functions-action@v1
      with:
        app-name: func-event-checkin
        package: './azure-functions'
        publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
```

## Step 4: Database Setup

### Cosmos DB Schema

```javascript
// scripts/setup-database.js
const { CosmosClient } = require('@azure/cosmos');

async function setupDatabase() {
    const client = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING);
    
    // Create database
    const { database } = await client.databases.createIfNotExists({
        id: 'EventCheckIn'
    });
    
    // Create containers
    await database.containers.createIfNotExists({
        id: 'Attendees',
        partitionKey: { paths: ['/email'] },
        indexingPolicy: {
            indexingMode: 'consistent',
            includedPaths: [
                { path: '/firstName/*' },
                { path: '/lastName/*' },
                { path: '/department/*' },
                { path: '/checkedIn/*' },
                { path: '/registrationTime/*' }
            ]
        }
    });
    
    await database.containers.createIfNotExists({
        id: 'Events',
        partitionKey: { paths: ['/id'] }
    });
    
    console.log('Database setup completed');
}

setupDatabase().catch(console.error);
```

## Step 5: Security Configuration

### Key Vault Setup

```bash
# Create Key Vault
az keyvault create \
  --name kv-event-checkin \
  --resource-group rg-event-checkin \
  --location "East US"

# Add secrets
az keyvault secret set --vault-name kv-event-checkin --name "CosmosDBKey" --value "your-cosmos-key"
az keyvault secret set --vault-name kv-event-checkin --name "AzureClientSecret" --value "your-client-secret"

# Grant Function App access
az keyvault set-policy \
  --name kv-event-checkin \
  --object-id $(az functionapp identity show --name func-event-checkin --resource-group rg-event-checkin --query principalId -o tsv) \
  --secret-permissions get
```

### Function App Identity

```bash
# Enable system-assigned managed identity
az functionapp identity assign \
  --name func-event-checkin \
  --resource-group rg-event-checkin
```

## Step 6: Monitoring Setup

### Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app ai-event-checkin \
  --location "East US" \
  --resource-group rg-event-checkin

# Configure Function App
az functionapp config appsettings set \
  --name func-event-checkin \
  --resource-group rg-event-checkin \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY="your-instrumentation-key"
```

### Alerts Configuration

```bash
# CPU usage alert
az monitor metrics alert create \
  --name "High CPU Usage" \
  --resource-group rg-event-checkin \
  --scopes /subscriptions/YOUR_SUBSCRIPTION/resourceGroups/rg-event-checkin/providers/Microsoft.Web/sites/func-event-checkin \
  --condition "avg Percentage CPU > 80" \
  --description "Alert when CPU usage is over 80%"

# Failed requests alert
az monitor metrics alert create \
  --name "High Error Rate" \
  --resource-group rg-event-checkin \
  --scopes /subscriptions/YOUR_SUBSCRIPTION/resourceGroups/rg-event-checkin/providers/Microsoft.Web/sites/func-event-checkin \
  --condition "total Http 5xx > 10" \
  --description "Alert when error rate is high"
```

## Step 7: Custom Domain Setup

### Static Web Apps Custom Domain

```bash
# Add custom domain
az staticwebapp hostname set \
  --name swa-event-checkin \
  --hostname your-domain.com

# Verify domain ownership (follow Azure portal instructions)
```

### SSL Certificate

```bash
# Azure automatically provides SSL certificates for custom domains
# Ensure HTTPS redirect is enabled
az staticwebapp config set \
  --name swa-event-checkin \
  --resource-group rg-event-checkin \
  --https-redirect true
```

## Step 8: Testing Deployment

### Health Check Script

```bash
#!/bin/bash
# health-check.sh

API_BASE_URL="https://func-event-checkin.azurewebsites.net/api"
FRONTEND_URL="https://swa-event-checkin.azurestaticapps.net"

echo "🔍 Testing deployment health..."

# Test API endpoints
echo "Testing API health..."
curl -f "${API_BASE_URL}/health" || echo "❌ API health check failed"

echo "Testing attendees endpoint..."
curl -f "${API_BASE_URL}/attendees" || echo "❌ Attendees endpoint failed"

# Test frontend
echo "Testing frontend..."
curl -f "$FRONTEND_URL" || echo "❌ Frontend health check failed"

echo "✅ Health check completed"
```

## Step 9: Backup and Recovery

### Database Backup

```bash
# Enable automatic backup for Cosmos DB
az cosmosdb update \
  --name cosmos-event-checkin \
  --resource-group rg-event-checkin \
  --backup-interval 240 \
  --backup-retention 8
```

### Function App Backup

```bash
# Create storage account for backups
az storage account create \
  --name stbackupeventcheckin \
  --resource-group rg-event-checkin \
  --sku Standard_LRS

# Configure backup (via Azure Portal recommended)
```

## Post-Deployment Checklist

- [ ] All Azure resources created successfully
- [ ] Function App deployed and running
- [ ] Static Web App deployed and accessible
- [ ] Database schema created
- [ ] Environment variables configured
- [ ] SSL certificates active
- [ ] Monitoring and alerts configured
- [ ] Custom domain configured (if applicable)
- [ ] Health checks passing
- [ ] Security scanning completed
- [ ] Documentation updated with URLs and credentials

## Troubleshooting

### Common Issues

1. **Function App not starting**
   - Check Node.js version compatibility
   - Verify all required environment variables are set
   - Review Application Insights logs

2. **Database connection errors**
   - Verify Cosmos DB connection string
   - Check firewall settings
   - Ensure managed identity permissions

3. **Email sending failures**
   - Verify Azure AD app permissions
   - Check Microsoft Graph API limits
   - Review email template formatting

4. **CORS issues**
   - Configure proper CORS settings in Function App
   - Verify frontend URL in allowed origins

### Monitoring Commands

```bash
# View Function App logs
az webapp log tail --name func-event-checkin --resource-group rg-event-checkin

# Check deployment status
az functionapp deployment list --name func-event-checkin --resource-group rg-event-checkin

# Monitor Cosmos DB metrics
az monitor metrics list --resource /subscriptions/YOUR_SUBSCRIPTION/resourceGroups/rg-event-checkin/providers/Microsoft.DocumentDB/databaseAccounts/cosmos-event-checkin
```

## Cost Optimization

### Development Environment
- Use consumption plans for Function Apps
- Use serverless Cosmos DB
- Leverage free tiers where available

### Production Environment
- Consider dedicated hosting plans for predictable workloads
- Implement auto-scaling policies
- Monitor and optimize resource usage
- Use reserved instances for cost savings

## Next Steps

1. Set up CI/CD pipelines
2. Implement comprehensive testing
3. Configure staging environments
4. Set up disaster recovery
5. Plan capacity scaling
6. Implement advanced monitoring
