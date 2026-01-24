import type { NextAuthConfig } from "next-auth";

// Notice this file has NO node-only imports (no prisma, no bcrypt)
export default {
    providers: [], // Providers are added in auth.ts to keep this edge-compatible
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isApiRoute = nextUrl.pathname.startsWith("/api");
            const isAuthRoute = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");
            const isPublicRoute = nextUrl.pathname === "/login"; // Add more as needed

            if (isApiRoute) return true;

            if (isAuthRoute) {
                if (isLoggedIn) {
                    return Response.redirect(new URL("/", nextUrl));
                }
                return true;
            }

            return isLoggedIn;
        },
    },
} satisfies NextAuthConfig;
