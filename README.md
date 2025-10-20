# Yadaphone - International Calling Web App

A comprehensive web application for making international calls from the browser using WebRTC and telephony APIs, with a credit-based payment system.

## Features

### Core Features
- 🌍 **International Calling**: Make calls to any country from your browser
- 💳 **Credit System**: Pay-as-you-go model with Stripe integration
- 📱 **WebRTC Integration**: Browser-based calling with Twilio Voice API
- 📊 **Call Tracking**: Real-time call status and cost tracking
- 📈 **Admin Panel**: Manage rates, users, and view revenue analytics
- 🔐 **Authentication**: Secure user registration and login
- 📋 **Call History**: Complete call logs and billing history

### User Features
- Beautiful landing page with pricing table
- User dashboard with balance management
- WebRTC dialer interface with call controls
- Call history and billing
- Secure payment processing

### Admin Features
- Rate management for different countries
- User management and analytics
- Revenue tracking and reporting
- Call statistics and monitoring

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **Telephony**: Twilio Voice API
- **UI Components**: Radix UI, Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Twilio account
- Stripe account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd yadaphone-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/yadaphone"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   
   # Twilio
   TWILIO_ACCOUNT_SID="your-twilio-account-sid"
   TWILIO_AUTH_TOKEN="your-twilio-auth-token"
   TWILIO_PHONE_NUMBER="+1234567890"
   
   # Stripe
   STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   
   # App Configuration
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `GET /api/auth/[...nextauth]` - NextAuth endpoints

### User Management
- `GET /api/user/profile` - Get user profile
- `GET /api/calls/history` - Get call history
- `POST /api/calls/initiate` - Initiate a call

### Payment Processing
- `POST /api/stripe/create-checkout-session` - Create Stripe checkout
- `POST /api/stripe/webhook` - Handle Stripe webhooks

### Admin Panel
- `GET /api/admin/rates` - Get call rates
- `PATCH /api/admin/rates` - Update call rates
- `GET /api/admin/users` - Get users list
- `GET /api/admin/stats` - Get admin statistics

### Telephony
- `POST /api/twilio/voice` - Twilio webhook handler

## Database Schema

The application uses the following main entities:

- **User**: User accounts with balance and admin status
- **Call**: Call records with duration, cost, and status
- **CallRate**: International calling rates by country
- **Payment**: Payment transactions and history
- **Account/Session**: NextAuth authentication data

## Deployment

### Environment Setup

1. **Database**: Set up a PostgreSQL database (recommended: Supabase, Railway, or AWS RDS)

2. **Twilio Setup**:
   - Create a Twilio account
   - Purchase a phone number
   - Set up webhook URLs

3. **Stripe Setup**:
   - Create a Stripe account
   - Set up webhook endpoints
   - Configure payment methods

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to your preferred platform**:
   - Vercel (recommended for Next.js)
   - Railway
   - AWS
   - DigitalOcean

3. **Configure environment variables** in your deployment platform

4. **Set up database migrations**:
   ```bash
   npm run db:push
   npm run db:seed
   ```

## Usage

### For Users

1. **Sign Up**: Create an account on the landing page
2. **Add Credits**: Use the dashboard to add credits via Stripe
3. **Make Calls**: Use the dialer to make international calls
4. **View History**: Check your call history and billing

### For Admins

1. **Access Admin Panel**: Use an admin account to access `/admin`
2. **Manage Rates**: Update international calling rates
3. **Monitor Users**: View user activity and revenue
4. **Analytics**: Track system performance and usage

## Security Features

- JWT-based authentication with NextAuth.js
- Secure password hashing with bcrypt
- Stripe webhook signature verification
- Twilio webhook validation
- Rate limiting on API endpoints
- Input validation and sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## Roadmap

### Future Features
- 📞 **Call Recording**: Record and retrieve call recordings
- 🤖 **AI Transcription**: Automatic call transcription
- 📝 **AI Summarization**: AI-powered call summaries
- 📱 **Virtual Numbers**: Receive calls with virtual numbers
- 🔍 **Caller ID Verification**: Enhanced caller verification
- 🌐 **Multi-language Support**: Internationalization
- 📊 **Advanced Analytics**: Detailed reporting and insights

---

Built with ❤️ using Next.js, React, and modern web technologies.