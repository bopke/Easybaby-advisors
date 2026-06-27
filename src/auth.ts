import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { isAllowed } from "@/lib/easybaby/allowlist";

// Request-scoped config: on Cloudflare Workers secrets live on the Worker env,
// so we read them via getCloudflareContext() per request rather than process.env.
export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
  const { env } = await getCloudflareContext({ async: true });
  return {
    trustHost: true,
    secret: env.AUTH_SECRET,
    session: { strategy: "jwt" },
    // Land both the sign-in prompt and auth errors (e.g. AccessDenied) on /admin.
    pages: { signIn: "/admin", error: "/admin" },
    providers: [
      Google({ clientId: env.AUTH_GOOGLE_ID, clientSecret: env.AUTH_GOOGLE_SECRET }),
    ],
    callbacks: {
      // Gate login on the D1 allowlist — only listed Google accounts may enter.
      async signIn({ user }) {
        return await isAllowed(user.email);
      },
    },
  };
});
