# Supabase to Azure Migration Plan - v1.0 Release

## Executive Summary

This document outlines the complete migration plan for transitioning the QR Code Event Check-in System from Supabase to Microsoft Azure infrastructure. The migration will maintain all current functionality while leveraging Azure's enterprise-grade services.

## Current State Assessment

### Supabase Services in Use
- **Database**: PostgreSQL with RLS policies
- **Authentication**: Supabase Auth
- **Edge Functions**: QR code email sending functionality
- **Real-time**: Database change subscriptions
- **Storage**: Currently not utilized

### Database Schema
- `events` - Event management
- `attendees` - Participant data with QR codes
- `profiles` - User profiles with role-based access
- `field_mappings` - Dynamic form field configuration
- `security_audit_log` - Security tracking

### Current Features
- ✅ Event creation and management
- ✅ CSV import with field mapping
- ✅ QR code generation and email distribution
- ✅ Mobile QR scanning for check-ins
- ✅ Real-time dashboard updates
- ✅ Role-based access control (admin/user)
- ✅ Security audit logging

## Azure Services Mapping

| Current (Supabase) | Target (Azure) | Rationale |
|-------------------|----------------|-----------|
| PostgreSQL Database | Azure Database for PostgreSQL | Direct compatibility, managed service |
| Supabase Auth | Azure AD B2C | Enterprise authentication, SSO integration |
| Edge Functions | Azure Functions | Serverless compute, auto-scaling |
| Real-time subscriptions | Azure SignalR Service | Real-time web functionality |
| React Frontend | Azure Static Web Apps | Integrated CI/CD, global CDN |
| Storage (future) | Azure Blob Storage | Enterprise file storage |

## Migration Phases

### Phase 1: Infrastructure Setup (Week 1)
1. **Azure Resource Provisioning**
   - Create Resource Group
   - Provision Azure Database for PostgreSQL
   - Set up Azure Functions App
   - Configure Azure Static Web Apps
   - Set up Azure SignalR Service
   - Configure Azure AD B2C tenant

2. **Network and Security Configuration**
   - Configure VNet and subnets
   - Set up firewall rules
   - Configure SSL certificates
   - Set up Azure Key Vault for secrets

### Phase 2: Database Migration (Week 2)
1. **Schema Migration**
   ```sql
   -- Export current schema from Supabase
   pg_dump --schema-only supabase_db > schema.sql
   
   -- Import to Azure PostgreSQL
   psql -h azure-postgres-server.postgres.database.azure.com -U admin@azure-postgres-server -d event_checkin < schema.sql
   ```

2. **Data Migration**
   ```sql
   -- Export data from Supabase
   pg_dump --data-only --inserts supabase_db > data.sql
   
   -- Import data to Azure
   psql -h azure-postgres-server.postgres.database.azure.com -U admin@azure-postgres-server -d event_checkin < data.sql
   ```

3. **RLS Policies Translation**
   - Convert Supabase RLS policies to Azure PostgreSQL
   - Test access control functionality

### Phase 3: Authentication Migration (Week 2-3)
1. **Azure AD B2C Configuration**
   - Set up user flows for sign-up/sign-in
   - Configure custom policies for role management
   - Set up API permissions and scopes

2. **User Migration**
   - Export user data from Supabase Auth
   - Import users to Azure AD B2C via Microsoft Graph API
   - Maintain user-profile relationships

3. **Frontend Authentication Updates**
   ```typescript
   // Replace Supabase auth client
   import { PublicClientApplication } from '@azure/msal-browser';
   
   const msalConfig = {
     auth: {
       clientId: 'your-client-id',
       authority: 'https://your-tenant.b2clogin.com/your-tenant.onmicrosoft.com/B2C_1_signupsignin'
     }
   };
   ```

### Phase 4: Backend Services Migration (Week 3-4)
1. **Azure Functions Development**
   - Migrate QR code email function
   - Implement database CRUD operations
   - Set up Microsoft Graph API integration for emails

2. **SignalR Integration**
   - Replace Supabase real-time with Azure SignalR
   - Implement connection management
   - Update frontend real-time subscriptions

3. **API Gateway Setup**
   - Configure Azure API Management
   - Set up rate limiting and authentication
   - Implement CORS policies

### Phase 5: Frontend Migration (Week 4)
1. **Static Web Apps Deployment**
   - Configure build pipeline
   - Set up custom domain
   - Configure routing rules

2. **Database Client Migration**
   ```typescript
   // Replace Supabase client with Azure SDK
   import { PostgreSQLClient } from '@azure/postgresql';
   
   const dbClient = new PostgreSQLClient({
     host: 'azure-postgres-server.postgres.database.azure.com',
     database: 'event_checkin',
     authentication: {
       type: 'azure-active-directory-msi'
     }
   });
   ```

### Phase 6: Testing and Validation (Week 5)
1. **Functional Testing**
   - Test all user workflows
   - Validate data integrity
   - Test QR code generation and scanning
   - Verify email functionality

2. **Performance Testing**
   - Load testing with Azure Load Testing
   - Database performance validation
   - API response time testing

3. **Security Testing**
   - Authentication flow testing
   - Authorization verification
   - Security audit log validation

## Code Changes Required

### 1. Database Client Replacement
```typescript
// Current: src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

// New: src/integrations/azure/client.ts
import { DefaultAzureCredential } from '@azure/identity';
import { PostgreSQLClient } from '@azure/postgresql';
```

### 2. Authentication Service
```typescript
// Current: src/contexts/AuthContext.tsx (Supabase)
// New: src/contexts/AuthContext.tsx (Azure AD B2C)
import { useMsal } from '@azure/msal-react';
```

### 3. Real-time Updates
```typescript
// Current: Supabase real-time subscriptions
// New: Azure SignalR connection
import { HubConnectionBuilder } from '@microsoft/signalr';
```

### 4. Edge Function Migration
```typescript
// Current: supabase/functions/send-qr-codes/index.ts
// New: azure-functions/send-qr-codes/index.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
```

## Data Migration Strategy

### 1. Pre-Migration Data Backup
```bash
# Create full backup of Supabase database
pg_dump supabase_connection_string > supabase_backup_$(date +%Y%m%d).sql

# Verify backup integrity
pg_restore --list supabase_backup_$(date +%Y%m%d).sql
```

### 2. Migration Scripts
```sql
-- User migration script
INSERT INTO azure_profiles (id, email, full_name, role, created_at)
SELECT auth_id, email, full_name, role, created_at 
FROM supabase_profiles;

-- Event data migration
INSERT INTO azure_events 
SELECT * FROM supabase_events;

-- Attendee data migration with QR code validation
INSERT INTO azure_attendees 
SELECT * FROM supabase_attendees 
WHERE qr_code_data IS NOT NULL;
```

### 3. Data Validation
```sql
-- Verify row counts match
SELECT 'supabase_events' as table_name, COUNT(*) as count FROM supabase_events
UNION ALL
SELECT 'azure_events' as table_name, COUNT(*) as count FROM azure_events;
```

## Security Considerations

### 1. Secrets Management
- Migrate all API keys to Azure Key Vault
- Update application configuration
- Implement managed service identity

### 2. Network Security
- Configure Azure Private Link
- Set up network security groups
- Implement Azure Web Application Firewall

### 3. Data Protection
- Enable Azure Database encryption at rest
- Configure TLS 1.2+ for all connections
- Implement Azure Monitor for security events

## Rollback Plan

### 1. Immediate Rollback (< 4 hours)
- DNS switch back to Supabase infrastructure
- Restore from pre-migration backup
- Validate all services operational

### 2. Data Sync Back
```sql
-- Sync any new data created during Azure testing
INSERT INTO supabase_tables 
SELECT * FROM azure_tables 
WHERE created_at > 'migration_start_timestamp';
```

## Timeline and Milestones

| Week | Phase | Key Deliverables | Success Criteria |
|------|-------|------------------|------------------|
| 1 | Infrastructure | Azure resources provisioned | All services responding |
| 2 | Database | Schema and data migrated | Query performance matches |
| 3 | Authentication | User migration complete | All users can authenticate |
| 4 | Backend | Functions deployed | All APIs functional |
| 5 | Testing | Full system validation | Performance benchmarks met |
| 6 | Go-Live | Production cutover | Zero downtime migration |

## Cost Analysis

### Current Supabase Costs (Estimated)
- Database: $25-50/month
- Auth: $0 (included)
- Edge Functions: $0-20/month
- **Total: $25-70/month**

### Projected Azure Costs
- Azure Database for PostgreSQL: $50-100/month
- Azure Functions: $0-20/month
- Azure AD B2C: $0-10/month (first 50K users free)
- Static Web Apps: $0-10/month
- SignalR Service: $0-25/month
- **Total: $50-165/month**

## Risk Mitigation

### High-Risk Items
1. **User Authentication Migration**
   - Risk: User lockout during migration
   - Mitigation: Parallel authentication systems during transition

2. **Real-time Functionality**
   - Risk: WebSocket connection issues
   - Mitigation: Fallback to polling mechanism

3. **Email Delivery**
   - Risk: Microsoft Graph API rate limits
   - Mitigation: Implement queue-based email processing

### Low-Risk Items
1. Database migration (direct PostgreSQL compatibility)
2. Static file hosting (standard web hosting)
3. QR code generation (self-contained logic)

## Success Metrics

### Technical Metrics
- Database query response time < 200ms (95th percentile)
- API response time < 500ms (95th percentile)
- 99.9% uptime SLA
- Zero data loss during migration

### Business Metrics
- All existing functionality preserved
- User authentication success rate > 99%
- Email delivery success rate > 98%
- Mobile QR scanning performance maintained

## Team Responsibilities

### DevOps Engineer
- Azure infrastructure provisioning
- CI/CD pipeline setup
- Monitoring and alerting configuration

### Backend Developer
- Azure Functions development
- Database migration scripts
- API integration testing

### Frontend Developer
- Authentication client updates
- Real-time connection migration
- UI/UX consistency validation

### QA Engineer
- End-to-end testing
- Performance validation
- Security testing

## Post-Migration Activities

### Week 1 After Go-Live
- Monitor system performance
- Address any user-reported issues
- Optimize query performance

### Week 2-4 After Go-Live
- Implement advanced monitoring
- Set up automated backups
- Optimize costs based on usage patterns

### Month 2-3 After Go-Live
- Implement additional Azure features
- Set up disaster recovery
- Plan for future enhancements

## Conclusion

This migration plan provides a comprehensive roadmap for transitioning from Supabase to Azure while maintaining system reliability and functionality. The phased approach minimizes risk and ensures business continuity throughout the migration process.

The successful completion of this migration will provide:
- Enterprise-grade infrastructure
- Better integration with Microsoft ecosystem
- Enhanced security and compliance capabilities
- Scalability for future growth
- Professional support and SLA guarantees

## Appendices

### Appendix A: Azure CLI Commands
[Include detailed Azure CLI scripts for infrastructure setup]

### Appendix B: Migration Scripts
[Include complete database migration scripts]

### Appendix C: Testing Checklists
[Include comprehensive testing procedures]

### Appendix D: Troubleshooting Guide
[Include common issues and solutions]