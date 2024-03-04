import NextAuth, { NextAuthOptions, Session, User } from "next-auth"
import { JWT } from "next-auth/jwt"
import GithubProvider from "next-auth/providers/github"

export const authOptions: NextAuthOptions = {
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET
        })
    ],
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token
            }
            return token
        },
        async session({
            session,
            token,
            user
        }: {
            session: Session
            token: JWT
            user: User
        }) {
            if (token.accessToken) {
                session.accessToken = token.accessToken as string
            }
            return session
        }
    }
}

export default NextAuth(authOptions)
