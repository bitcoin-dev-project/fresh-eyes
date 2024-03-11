import NextAuth, {
  GhExtendedProfile,
  NextAuthOptions,
  Session,
} from "next-auth";
import { JWT } from "next-auth/jwt";
import GithubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      authorization: {
        url: "https://github.com/login/oauth/authorize",
        params: { scope: "read:user user:email public_repo workflow" },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.profile = profile;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
        const { login, html_url } = token.profile as GhExtendedProfile;
        session.user.login = login;
        session.user.html_url = html_url;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
