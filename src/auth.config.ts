import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  providers: [],
  pages: { signIn: '/auth/login' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.role = (user as { role: string }).role
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  session: { strategy: 'jwt' as const },
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig
