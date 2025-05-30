
# Azure Backend Setup Guide

This guide walks you through setting up the complete Azure infrastructure for the QR code-based event check-in system.

## Overview

The system consists of:
- **Frontend**: React app (Azure Static Web Apps)
- **Backend**: Azure Functions for API endpoints
- **Database**: Azure Cosmos DB or Table Storage
- **Email Service**: Microsoft Graph API via Azure Functions
- **QR Generation**: Server-side QR code generation
- **Authentication**: Azure AD B2C or Azure AD

## Prerequisites

- Azure subscription
- Microsoft 365 tenant (for Graph API access)
- Azure CLI installed locally
- Node.js 18+ for local development

## Architecture Diagram

```
Microsoft Forms → Power Automate → Azure Functions → Cosmos DB
                                        ↓
Frontend (Static Web Apps) ← API Gateway ← Azure Functions
                                        ↓
                               Microsoft Graph API (Email)
```

## Step 1: Azure Resource Group Setup

```bash
# Create resource group
az group create --name rg-event-checkin --location "East US"
```

## Step 2: Database Setup (Choose One)

### Option A: Azure Cosmos DB (Recommended)

```bash
# Create Cosmos DB account
az cosmosdb create \
  --name cosmos-event-checkin \
  --resource-group rg-event-checkin \
  --default-consistency-level Session \
  --locations regionName="East US" failoverPriority=0 isZoneRedundant=False

# Create database
az cosmosdb sql database create \
  --account-name cosmos-event-checkin \
  --resource-group rg-event-checkin \
  --name EventCheckIn

# Create containers
az cosmosdb sql container create \
  --account-name cosmos-event-checkin \
  --resource-group rg-event-checkin \
  --database-name EventCheckIn \
  --name Attendees \
  --partition-key-path "/email" \
  --throughput 400
```

### Option B: Azure Table Storage (Cost-effective)

```bash
# Create storage account
az storage account create \
  --name steventcheckin \
  --resource-group rg-event-checkin \
  --location "East US" \
  --sku Standard_LRS
```

## Step 3: Azure Functions Setup

```bash
# Create Function App
az functionapp create \
  --resource-group rg-event-checkin \
  --consumption-plan-location "East US" \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --name func-event-checkin \
  --storage-account steventcheckin \
  --disable-app-insights false
```

## Step 4: Azure Static Web Apps

```bash
# Create Static Web App (can also be done via GitHub integration)
az staticwebapp create \
  --name swa-event-checkin \
  --resource-group rg-event-checkin \
  --location "East US 2"
```

## Step 5: Azure AD App Registration

1. Go to Azure Portal → Azure Active Directory → App registrations
2. Click "New registration"
3. Configure:
   - Name: "Event Check-in System"
   - Supported account types: "Accounts in this organizational directory only"
   - Redirect URI: `https://your-static-web-app.azurestaticapps.net`

4. After creation, note:
   - Application (client) ID
   - Directory (tenant) ID

5. Go to "Certificates & secrets" → Create new client secret
6. Go to "API permissions" → Add Microsoft Graph permissions:
   - `Mail.Send`
   - `User.Read`

## Environment Variables

Set these in your Azure Functions configuration:

```bash
# Database connection (choose one)
COSMOS_DB_CONNECTION_STRING="AccountEndpoint=https://cosmos-event-checkin.documents.azure.com:443/;AccountKey=YOUR_KEY;"
# OR
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=steventcheckin;AccountKey=YOUR_KEY;"

# Azure AD
AZURE_CLIENT_ID="your-client-id"
AZURE_CLIENT_SECRET="your-client-secret"
AZURE_TENANT_ID="your-tenant-id"

# Application settings
JWT_SECRET="your-jwt-secret"
FRONTEND_URL="https://your-static-web-app.azurestaticapps.net"
```

## Next Steps

1. Follow the [Backend Development Guide](./backend-development.md) to implement the Azure Functions
2. Follow the [Microsoft Forms Integration Guide](./microsoft-forms-integration.md) to connect your form
3. Follow the [Email Service Setup Guide](./email-service-setup.md) to configure QR code emails
4. Follow the [Deployment Guide](./deployment.md) to deploy everything

## Security Considerations

- Enable HTTPS only for all services
- Configure CORS properly for Static Web Apps
- Use Azure Key Vault for sensitive secrets
- Enable Azure AD authentication for admin portal
- Set up monitoring and logging with Application Insights

## Cost Estimation

- Azure Functions: ~$0-20/month (consumption plan)
- Cosmos DB: ~$25-100/month (400 RU/s)
- Static Web Apps: Free tier available
- Storage: ~$1-5/month
- **Total estimated monthly cost: $25-125**

## Support and Troubleshooting

- Monitor Function App logs in Azure Portal
- Use Application Insights for detailed telemetry
- Check Static Web Apps build logs for deployment issues
- Test Graph API permissions in Graph Explorer
