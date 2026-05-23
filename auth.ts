import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Here you would check against your database
        // e.g., const user = await db.user.findUnique({ where: { email: credentials.email } })
        
        if (credentials?.email === "admin@university.edu" && credentials?.password === "password123") {
          return { id: "1", name: "Administrator", email: "admin@university.edu", role: "admin" };
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: "/", // Directs unauthorized users back to your root login page
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    }
  }
});
