# YadaPhone Production Deployment Guide

## 🚀 Production Environment Setup

This guide covers the complete setup for deploying YadaPhone to production with all enterprise features enabled.

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL or MySQL database
- Redis (optional, for caching)
- AWS S3 or similar for call recording storage
- Domain name with SSL certificate

## 🔧 Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-32-character-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Twilio (Primary Provider)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Stripe Payments
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Enterprise API
ENTERPRISE_API_KEY="ent_production_secure_api_key"
```

### Optional Multi-Provider Variables

```bash
# Telnyx (Secondary Provider)
TELNYX_API_KEY="your-telnyx-api-key"
TELNYX_PHONE_NUMBER="+1234567890"
TELNYX_CONNECTION_ID="your-connection-id"

# Vonage (Fallback Provider)
VONAGE_API_KEY="your-vonage-api-key"
VONAGE_API_SECRET="your-vonage-api-secret"
VONAGE_PHONE_NUMBER="+1234567890"
```

### Optional Enhancement Variables

```bash
# Call Recording Storage
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET="your-recordings-bucket"
AWS_REGION="us-east-1"

# Redis Cache
REDIS_URL="redis://username:password@host:port"

# Email Service (for notifications)
SMTP_HOST="smtp.yourdomain.com"
SMTP_PORT="587"
SMTP_USER="noreply@yourdomain.com"
SMTP_PASS="your-smtp-password"

# Monitoring
SENTRY_DSN="your-sentry-dsn"
LOG_LEVEL="info"
```

## 🗄️ Database Setup

### 1. Create Production Database

```sql
-- PostgreSQL
CREATE DATABASE yadaphone_production;
CREATE USER yadaphone_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE yadaphone_production TO yadaphone_user;

-- MySQL
CREATE DATABASE yadaphone_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'yadaphone_user'@'%' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON yadaphone_production.* TO 'yadaphone_user'@'%';
FLUSH PRIVILEGES;
```

### 2. Run Migrations

```bash
# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed initial data (optional)
npx prisma db seed
```

### 3. Create Admin User

```bash
# Run the admin creation script
npm run create-admin
```

## 📦 Deployment Options

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

2. **Configure Environment Variables**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add all required variables from the list above

3. **Database Connection**
   - Use Vercel Postgres, PlanetScale, or external PostgreSQL
   - Update `DATABASE_URL` accordingly

### Option 2: Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npx prisma generate
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Docker Compose**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - DATABASE_URL=postgresql://user:pass@db:5432/yadaphone
       depends_on:
         - db
     db:
       image: postgres:15
       environment:
         POSTGRES_DB: yadaphone
         POSTGRES_USER: user
         POSTGRES_PASSWORD: pass
       volumes:
         - postgres_data:/var/lib/postgresql/data
   volumes:
     postgres_data:
   ```

### Option 3: VPS Deployment

1. **Server Setup**
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   npm install -g pm2
   
   # Clone repository
   git clone https://github.com/yourusername/yadaphone-app.git
   cd yadaphone-app
   ```

2. **Application Setup**
   ```bash
   # Install dependencies
   npm ci --production
   
   # Build application
   npm run build
   
   # Start with PM2
   pm2 start npm --name "yadaphone" -- start
   pm2 startup
   pm2 save
   ```

## 🔒 Security Configuration

### 1. SSL/TLS Certificate
```bash
# Using Certbot for Let's Encrypt
sudo certbot --nginx -d yourdomain.com
```

### 2. Rate Limiting
Configure rate limiting in your reverse proxy (Nginx/Apache) or use middleware.

### 3. CORS Configuration
Update `next.config.js` for production domains:
```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://yourdomain.com',
          },
        ],
      },
    ];
  },
};
```

## 📊 Monitoring & Analytics

### 1. Application Monitoring
```bash
# Install monitoring tools
npm install @sentry/nextjs
```

### 2. Database Monitoring
- Set up database performance monitoring
- Configure automated backups
- Monitor connection pool usage

### 3. Call Analytics
- Monitor provider success rates
- Track call completion rates
- Set up alerts for high failure rates

## 🔧 Performance Optimization

### 1. Caching Strategy
```bash
# Redis for session storage and caching
npm install redis ioredis
```

### 2. CDN Configuration
- Configure CloudFlare or AWS CloudFront
- Cache static assets
- Enable gzip compression

### 3. Database Optimization
- Add proper indexes
- Configure connection pooling
- Set up read replicas if needed

## 🚨 Backup & Recovery

### 1. Database Backups
```bash
# PostgreSQL backup
pg_dump -h host -U user -d database > backup.sql

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > backup_$DATE.sql
aws s3 cp backup_$DATE.sql s3://your-backup-bucket/
```

### 2. Application Backups
- Version control with Git
- Automated deployments
- Environment variable backups

## 🏁 Go-Live Checklist

- [ ] All environment variables configured
- [ ] Database migrated and seeded
- [ ] SSL certificate installed
- [ ] DNS configured
- [ ] Monitoring enabled
- [ ] Backup strategy implemented
- [ ] Load testing completed
- [ ] Security scan performed
- [ ] Admin user created
- [ ] Payment system tested
- [ ] Call routing tested with all providers
- [ ] Recording system tested
- [ ] Enterprise APIs tested

## 📞 Support & Maintenance

### Regular Tasks
- Monitor system performance
- Review error logs
- Update dependencies
- Backup verification
- Security updates

### Emergency Contacts
- Database issues: DBA team
- Payment issues: Stripe support
- Call routing: Provider support teams
- Application issues: Development team

## 🔗 Additional Resources

- [Next.js Production Guide](https://nextjs.org/docs/deployment)
- [Prisma Production Guide](https://www.prisma.io/docs/guides/deployment)
- [Twilio Best Practices](https://www.twilio.com/docs/usage/best-practices)
- [Stripe Production Checklist](https://stripe.com/docs/payments/accept-a-payment)

---

For additional support or questions, contact the development team or refer to the project documentation.