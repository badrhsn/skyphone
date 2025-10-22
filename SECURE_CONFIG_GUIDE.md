# Secure Configuration Management System

## 🔐 Overview

This secure configuration management system replaces insecure environment variable storage with encrypted database storage for sensitive API credentials and configuration data.

## 🏗️ Architecture

### Core Components

1. **SecureConfigManager** (`src/lib/secure-config.ts`)
   - AES-256-GCM encryption for sensitive data
   - In-memory caching with TTL
   - Audit trail logging
   - Configuration rotation support

2. **Database Models** (`prisma/schema.prisma`)
   - `ApiConfiguration`: Stores encrypted configuration data
   - `ConfigurationAudit`: Tracks all configuration changes

3. **Admin Dashboard** (`src/app/admin/configurations/page.tsx`)
   - Web interface for configuration management
   - Provider templates for common services
   - Audit trail visualization
   - Configuration testing utilities

4. **API Endpoints** (`src/app/api/admin/configurations/`)
   - RESTful API for configuration CRUD operations
   - Migration utilities
   - Configuration testing endpoints

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Required: Set encryption key
export CONFIG_ENCRYPTION_KEY="your-32-character-encryption-key"

# Optional: Database URL (defaults to SQLite)
export DATABASE_URL="file:./dev.db"
```

### 2. Database Migration

```bash
# Apply database schema
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### 3. Migrate Existing Environment Variables

```bash
# Automated migration from .env.local
npx tsx scripts/migrate-env-to-db.ts

# Or use the admin API endpoint
curl -X POST http://localhost:3000/api/admin/configurations/migrate \
  -H "Content-Type: application/json" \
  -d '{"includeBackup": true}'
```

## 💻 Usage Examples

### Using SecureConfigManager Directly

```typescript
import { secureConfig } from '@/lib/secure-config';

// Store configuration
await secureConfig.setConfig('TWILIO', {
  accountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  authToken: 'your-auth-token',
  phoneNumber: '+1234567890'
}, userId, 'production');

// Retrieve configuration
const twilioConfig = await secureConfig.getConfig('TWILIO', userId);
console.log(twilioConfig.accountSid);

// Get specific value
const authToken = await secureConfig.getConfigValue('TWILIO', 'authToken', userId);
```

### Using in API Routes

```typescript
import { secureConfig } from '@/lib/secure-config';

export async function POST(request: NextRequest) {
  // Get Stripe configuration securely
  const stripeConfig = await secureConfig.getConfig('STRIPE');
  
  const stripe = new Stripe(stripeConfig.secretKey);
  // ... use Stripe client
}
```

### Admin Dashboard Access

Navigate to `/admin/configurations` to:
- View all configured providers
- Add/edit configurations using provider templates
- Test configuration connectivity
- View audit trails
- Migrate from environment variables

## 🔧 Supported Providers

The system includes templates for:

- **Twilio**: `accountSid`, `authToken`, `phoneNumber`
- **Stripe**: `secretKey`, `publishableKey`, `webhookSecret`
- **Google OAuth**: `clientId`, `clientSecret`
- **Telnyx**: `apiKey`, `publicKey`
- **Vonage**: `apiKey`, `apiSecret`, `applicationId`, `privateKey`

## 🛡️ Security Features

### Encryption
- **Algorithm**: AES-256-GCM
- **Key Derivation**: PBKDF2 with salt
- **Authenticated Encryption**: Prevents tampering

### Access Control
- Admin-only access to configuration management
- User-based audit trails
- Environment isolation (dev/staging/prod)

### Audit Trail
All configuration operations are logged:
- Configuration creation/updates
- Access attempts
- Rotation events
- Deactivation

## 📊 Migration Strategy

### Phase 1: Setup
1. Add `CONFIG_ENCRYPTION_KEY` to environment
2. Apply database migrations
3. Deploy secure configuration system

### Phase 2: Migration
1. Run migration script to move credentials from `.env.local`
2. Update application code to use `secureConfig`
3. Test all integrations thoroughly

### Phase 3: Cleanup
1. Remove sensitive variables from `.env.local`
2. Update deployment scripts
3. Monitor audit trails

## 🧪 Testing

### Run Integration Tests
```bash
npx tsx integration-test.ts
```

### Test Configuration Connectivity
```bash
curl -X POST http://localhost:3000/api/admin/configurations/test \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "TWILIO",
    "configData": {
      "accountSid": "ACxxxxxxxx",
      "authToken": "your-token"
    }
  }'
```

## 🚨 Production Checklist

- [ ] Set strong `CONFIG_ENCRYPTION_KEY` (32+ characters)
- [ ] Apply database migrations
- [ ] Migrate all sensitive environment variables
- [ ] Remove credentials from `.env` files
- [ ] Test all API integrations
- [ ] Monitor audit trails
- [ ] Set up configuration backup strategy
- [ ] Document access procedures for team

## 🔄 Configuration Rotation

Regular rotation of API credentials is recommended:

```typescript
// Rotate Twilio credentials
await secureConfig.rotateConfig('TWILIO', {
  accountSid: 'new-account-sid',
  authToken: 'new-auth-token',
  phoneNumber: '+1234567890'
}, userId);
```

## 📈 Monitoring & Alerts

Monitor the audit trail for:
- Unusual access patterns
- Failed decryption attempts
- Configuration changes outside business hours
- High-frequency access from single users

## 🆘 Troubleshooting

### Common Issues

1. **"Property 'apiConfiguration' does not exist"**
   - Run `npx prisma generate`
   - Restart TypeScript server in VS Code

2. **Decryption Errors**
   - Verify `CONFIG_ENCRYPTION_KEY` is set correctly
   - Ensure key hasn't changed since encryption

3. **Admin Access Denied**
   - Verify user has `isAdmin: true` in database
   - Check session authentication

### Recovery Procedures

If encryption key is lost:
1. Configuration data cannot be recovered
2. Deactivate all configurations
3. Re-enter credentials manually
4. Update `CONFIG_ENCRYPTION_KEY`

## 📚 API Reference

### SecureConfigManager Methods

- `setConfig(provider, config, userId?, environment?)`: Store encrypted configuration
- `getConfig(provider, userId?)`: Retrieve decrypted configuration
- `getConfigValue(provider, key, userId?)`: Get specific configuration value
- `rotateConfig(provider, newConfig, userId?)`: Rotate configuration with audit
- `deactivateConfig(provider, userId?)`: Deactivate configuration
- `getActiveProviders()`: List all active providers

### Admin API Endpoints

- `GET /api/admin/configurations`: List all configurations
- `POST /api/admin/configurations`: Create new configuration
- `GET /api/admin/configurations/[id]`: Get specific configuration
- `PUT /api/admin/configurations/[id]`: Update configuration
- `DELETE /api/admin/configurations/[id]`: Delete configuration
- `POST /api/admin/configurations/migrate`: Migrate from environment variables
- `POST /api/admin/configurations/test`: Test configuration connectivity
- `GET /api/admin/configurations/audit/[provider]`: Get audit trail

---

**Security Note**: This system significantly improves security over environment variables, but should be combined with other security measures like network security, access controls, and regular security audits.