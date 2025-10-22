# How to Create an Admin User

There are several ways to create an admin user to access the admin dashboard:

## Method 1: Interactive Script (Recommended)

Run the interactive admin user creation script:

```bash
npx tsx scripts/create-admin-user.ts
```

This will:
- Prompt for email, name, and password
- Hash the password securely
- Create the admin user in the database
- Provide login instructions

## Method 2: Direct SQL (Quick)

If you want to quickly create an admin user with default credentials:

```bash
# Open SQLite database
sqlite3 prisma/dev.db

# Run the SQL commands
.read scripts/create-admin.sql

# Exit SQLite
.exit
```

**Default credentials:**
- Email: `admin@yadaphone.com`
- Password: `admin123`

⚠️ **Important**: Change the password after first login!

## Method 3: Prisma Studio (Visual)

1. Open Prisma Studio:
```bash
npx prisma studio
```

2. Go to the User table
3. Click "Add record"
4. Fill in:
   - email: `admin@yadaphone.com`
   - name: `Admin User`
   - password: `$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3QJUPgFTSe` (admin123)
   - isAdmin: `true`
   - balance: `0`
   - emailVerified: current date
5. Save the record

## Method 4: Make Existing User Admin

If you already have a user account:

```bash
# Update existing user to admin
npx prisma db seed <<EOF
import { prisma } from './src/lib/db';

async function makeAdmin() {
  await prisma.user.update({
    where: { email: 'your-email@example.com' },
    data: { isAdmin: true }
  });
}

makeAdmin();
EOF
```

## Accessing the Admin Dashboard

Once you have an admin user:

1. **Start the development server:**
```bash
npm run dev
```

2. **Sign in:**
   - Go to http://localhost:3000/auth/signin
   - Use your admin credentials

3. **Access admin dashboard:**
   - Navigate to http://localhost:3000/admin/configurations
   - Or use the admin navigation menu

## Admin Dashboard Features

Once logged in as admin, you can:

- **Manage API Configurations**: Add, edit, and delete encrypted configurations
- **Use Provider Templates**: Pre-configured forms for Twilio, Stripe, Google OAuth, etc.
- **Test Configurations**: Verify API connectivity
- **View Audit Trails**: See who accessed/modified configurations
- **Migrate from Environment**: Move existing .env variables to secure storage

## Security Notes

- Admin users have full access to all encrypted configurations
- All admin actions are logged in the audit trail
- Use strong passwords for admin accounts
- Consider using environment-specific admin accounts (dev/staging/prod)

## Troubleshooting

**"Access Denied"**: Ensure the user has `isAdmin: true` in the database
**"Not Authenticated"**: Sign in first at `/auth/signin`
**"Script Errors"**: Make sure you're in the project directory and dependencies are installed