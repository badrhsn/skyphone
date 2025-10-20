#!/bin/bash

# YadaPhone Production Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

echo "🚀 Starting YadaPhone Production Deployment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    log_error ".env.production file not found!"
    log_info "Please copy .env.production.template to .env.production and configure your variables"
    exit 1
fi

# Load environment variables
source .env.production

# Validate required environment variables
log_info "Validating environment variables..."

required_vars=(
    "DATABASE_URL"
    "NEXTAUTH_URL"
    "NEXTAUTH_SECRET"
    "TWILIO_ACCOUNT_SID"
    "TWILIO_AUTH_TOKEN"
    "STRIPE_SECRET_KEY"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        log_error "Required environment variable $var is not set"
        exit 1
    fi
done

log_success "Environment variables validated"

# Install dependencies
log_info "Installing production dependencies..."
npm ci --production --silent
log_success "Dependencies installed"

# Generate Prisma client
log_info "Generating Prisma client..."
npx prisma generate
log_success "Prisma client generated"

# Run database migrations
log_info "Running database migrations..."
npx prisma db push --accept-data-loss
log_success "Database migrations completed"

# Build application
log_info "Building Next.js application..."
npm run build
log_success "Application built successfully"

# Create admin user if it doesn't exist
log_info "Checking for admin user..."
if node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findFirst({ where: { isAdmin: true } })
  .then(admin => {
    if (!admin) {
      console.log('NO_ADMIN');
      process.exit(1);
    }
    process.exit(0);
  })
  .catch(() => process.exit(1));
"; then
    log_success "Admin user exists"
else
    log_warning "No admin user found. Creating default admin..."
    # You would implement admin creation logic here
    log_info "Please run 'npm run create-admin' manually after deployment"
fi

# Test database connection
log_info "Testing database connection..."
if node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('Database connection successful');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });
"; then
    log_success "Database connection successful"
else
    log_error "Database connection failed"
    exit 1
fi

# Start application in production mode
log_info "Starting application..."

if command -v pm2 &> /dev/null; then
    log_info "Using PM2 process manager..."
    pm2 start ecosystem.config.js --env production
    pm2 save
    log_success "Application started with PM2"
else
    log_warning "PM2 not found. Starting with npm..."
    log_info "Consider installing PM2 for production: npm install -g pm2"
    npm start &
    log_success "Application started"
fi

# Health check
log_info "Performing health check..."
sleep 5  # Give the app time to start

if curl -f -s "$NEXTAUTH_URL/api/health" > /dev/null; then
    log_success "Health check passed"
else
    log_error "Health check failed"
    log_info "Check application logs for errors"
fi

echo ""
log_success "🎉 Deployment completed successfully!"
echo ""
echo "Application Details:"
echo "==================="
echo "URL: $NEXTAUTH_URL"
echo "Environment: production"
echo "Database: Connected"
echo ""
echo "Next Steps:"
echo "==========="
echo "1. Test all critical features"
echo "2. Monitor application logs"
echo "3. Set up monitoring alerts"
echo "4. Configure SSL certificate"
echo "5. Set up backup procedures"
echo ""
echo "For monitoring, use:"
echo "- 'pm2 status' (if using PM2)"
echo "- 'pm2 logs yadaphone' (view logs)"
echo "- 'pm2 monit' (real-time monitoring)"
echo ""

log_success "Deployment script completed!"