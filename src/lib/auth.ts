import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "./db"
import bcrypt from "bcryptjs"
import { getGoogleOAuthConfig } from "./config-helper"

// Function to get auth options with dynamic configuration
export async function getAuthOptions(): Promise<NextAuthOptions> {
  const googleConfig = await getGoogleOAuthConfig();
  
  return {
    providers: [
      ...(googleConfig?.clientId && googleConfig?.clientSecret ? [
        GoogleProvider({
          clientId: googleConfig.clientId,
          clientSecret: googleConfig.clientSecret,
        })
      ] : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password || ""
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          balance: user.balance,
          isAdmin: user.isAdmin,
        }
      }
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token?.sub) {
        session.user.id = token.sub
        
        // Get fresh user data from database
        const user = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { balance: true, isAdmin: true, email: true }
        })
        
        if (user) {
          session.user.balance = user.balance
          session.user.isAdmin = user.isAdmin
          // Also check by email for admin access
          if (user.email === 'admin@yadaphone.com') {
            session.user.isAdmin = true
          }
        }
      }
      return session
    },
    jwt: async ({ user, token, account }) => {
      if (user) {
        token.uid = user.id
        token.isAdmin = user.isAdmin
        token.email = user.email
      }
      return token
    },
    signIn: async ({ user, account, profile }) => {
      if (account?.provider === "google") {
        try {
          // Check if user exists, if not create them
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })
          
          if (!existingUser) {
            // Create new user for Google OAuth
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name || '',
                image: user.image,
                balance: 0, // Give new Google users $5 credit
                isAdmin: false,
              }
            })
            // Update the user object with the new ID and admin status
            user.id = newUser.id
            user.isAdmin = newUser.isAdmin
          } else {
            // Use existing user ID and check admin status
            user.id = existingUser.id
            user.isAdmin = existingUser.isAdmin
          }
          
          return true
        } catch (error) {
          console.error('Error in Google sign-in callback:', error)
          return false
        }
      }
      return true
    },
    redirect: async ({ url, baseUrl }) => {
      // Allow any valid callback URL to proceed
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // Default redirect to dashboard for successful logins
      return `${baseUrl}/dashboard`;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  };
}

// Legacy export for backward compatibility
export const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password || ""
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          balance: user.balance,
          isAdmin: user.isAdmin,
        }
      }
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token?.sub) {
        session.user.id = token.sub
        
        const user = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { balance: true, isAdmin: true, email: true }
        })
        
        if (user) {
          session.user.balance = user.balance
          session.user.isAdmin = user.isAdmin
          if (user.email === 'admin@yadaphone.com') {
            session.user.isAdmin = true
          }
        }
      }
      return session
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.uid = user.id
        token.isAdmin = user.isAdmin
        token.email = user.email
      }
      return token
    },
    signIn: async ({ user, account }) => {
      if (account?.provider === "google") {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })
          
          if (!existingUser) {
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name || '',
                image: user.image,
                balance: 0,
                isAdmin: false,
              }
            })
            user.id = newUser.id
            user.isAdmin = newUser.isAdmin
          } else {
            user.id = existingUser.id
            user.isAdmin = existingUser.isAdmin
          }
          
          return true
        } catch (error) {
          console.error('Error in Google sign-in callback:', error)
          return false
        }
      }
      return true
    },
    redirect: async ({ url, baseUrl }) => {
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return `${baseUrl}/dashboard`;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
}