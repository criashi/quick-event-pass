# Azure Static Web Apps Deployment Guide

## Overview
This guide covers deploying the Aumovio Events frontend to Azure Static Web Apps while maintaining the Supabase backend integration.

## Prerequisites
- Azure account with Static Web Apps enabled
- GitHub repository connected
- Domain `events.aumovio.com` ready for configuration

## Deployment Steps

### 1. Create Azure Static Web App
```bash
# Using Azure CLI
az staticwebapp create \
  --name "aumovio-events" \
  --resource-group "aumovio-rg" \
  --source "https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME" \
  --location "East US 2" \
  --branch "main" \
  --app-location "/" \
  --output-location "dist" \
  --login-with-github
```

### 2. Configure Environment Variables
In Azure Portal → Static Web Apps → Configuration:

**Application Settings:**
- `VITE_SUPABASE_URL`: `https://ggdcqdqrerrqqtzctomd.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnZGNxZHFyZXJycXF0emN0b21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMzIwNjksImV4cCI6MjA2NDcwODA2OX0.Moj7VWhabZiZAjurSl0G2gxknCe70_nZZONZwab7V6o`
- `VITE_SUPABASE_PROJECT_ID`: `ggdcqdqrerrqqtzctomd`

### 3. Configure Custom Domain
1. Go to Azure Portal → Static Web Apps → Custom domains
2. Click "Add custom domain"
3. Enter: `events.aumovio.com`
4. Follow DNS configuration instructions
5. Add CNAME record pointing to your Static Web App URL

### 4. GitHub Repository Configuration

**Required GitHub Secrets:**
- `AZURE_STATIC_WEB_APPS_API_TOKEN`: Get from Azure Portal → Static Web Apps → Manage deployment token

**Required GitHub Variables:**
- `VITE_SUPABASE_URL`: `https://ggdcqdqrerrqqtzctomd.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnZGNxZHFyZXJycXF0emN0b21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMzIwNjksImV4cCI6MjA2NDcwODA2OX0.Moj7VWhabZiZAjurSl0G2gxknCe70_nZZONZwab7V6o`
- `VITE_SUPABASE_PROJECT_ID`: `ggdcqdqrerrqqtzctomd`

### 5. DNS Configuration for Custom Domain

**For events.aumovio.com:**
```
Type: CNAME
Name: events
Value: [your-static-web-app-name].azurestaticapps.net
TTL: 300
```

**For www.events.aumovio.com (optional):**
```
Type: CNAME
Name: www.events
Value: [your-static-web-app-name].azurestaticapps.net
TTL: 300
```

## Features Enabled

### Routing Configuration
- SPA routing with fallback to index.html
- Public access to scavenger hunt routes (`/hunt/*`)
- Protected routes for authenticated users
- API proxy configuration for Supabase

### Security Headers
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection enabled

### Performance Optimizations
- Static asset caching
- Gzip compression enabled
- CDN distribution globally

## Testing Deployment

### Local Testing
```bash
# Install Azure Static Web Apps CLI
npm install -g @azure/static-web-apps-cli

# Test locally
npm run build
swa start dist --port 4280
```

### Production Validation
1. **Authentication Flow**
   - Test login/logout functionality
   - Verify protected routes redirect properly

2. **Scavenger Hunt Public Routes**
   - Test `/hunt/:token` routes work without authentication
   - Verify QR code scanning functionality

3. **API Integration**
   - Test Supabase client connectivity
   - Verify edge functions work properly

4. **Performance**
   - Check Core Web Vitals
   - Verify fast loading times globally

## Monitoring and Logging

### Azure Monitor Integration
```bash
# Enable Application Insights
az monitor app-insights component create \
  --app "aumovio-events-insights" \
  --location "East US 2" \
  --resource-group "aumovio-rg"
```

### Health Checks
- Monitor uptime and performance
- Set up alerts for availability issues
- Track user engagement metrics

## Rollback Strategy

### GitHub-based Rollback
1. Revert to previous commit in GitHub
2. Push to main branch
3. Automatic redeployment triggers

### Manual Rollback
1. Go to Azure Portal → Static Web Apps → Functions
2. Select previous deployment
3. Set as active deployment

## Cost Optimization

### Free Tier Limits
- 100 GB bandwidth/month
- 0.5 GB storage
- Custom domains included
- SSL certificates included

### Monitoring Usage
```bash
# Check usage metrics
az staticwebapp show \
  --name "aumovio-events" \
  --resource-group "aumovio-rg" \
  --query "usage"
```

## Troubleshooting

### Common Issues

**Build Failures:**
- Check environment variables are set correctly
- Verify Node.js version compatibility (use Node 18)
- Check build logs in GitHub Actions

**Routing Issues:**
- Verify `staticwebapp.config.json` is in root directory
- Check route patterns match your application routes
- Test fallback routes work correctly

**Authentication Problems:**
- Verify Supabase environment variables
- Check CORS settings in Supabase
- Test authentication flow step by step

### Debug Commands
```bash
# Check deployment status
az staticwebapp show --name "aumovio-events" --resource-group "aumovio-rg"

# View deployment logs
az staticwebapp functions show --name "aumovio-events" --resource-group "aumovio-rg"

# Test custom domain
nslookup events.aumovio.com
```

## Next Steps After Deployment

1. **Update Email Service Configuration**
   - Update Resend domain verification for events.aumovio.com
   - Test QR code email functionality

2. **Performance Monitoring**
   - Set up Application Insights
   - Configure performance alerts

3. **Backup Strategy**
   - Document rollback procedures
   - Set up monitoring for deployment health

4. **Security Review**
   - Audit security headers
   - Review authentication flows
   - Test for XSS and CSRF vulnerabilities