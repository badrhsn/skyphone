import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "./db"
import bcrypt from "bcryptjs"

// Main auth options export
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true,
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

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
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
                balance: 0,
                isAdmin: false,
                // Don't set password for OAuth users
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
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
}