import type { NextAuthConfig } from 'next-auth'

// Base auth config that can be used in Edge Runtime (middleware)
// Does not include providers that use Node.js APIs like bcryptjs
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [], // Providers are added in config.ts for Node.js runtime
}
