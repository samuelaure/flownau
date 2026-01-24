import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export default {
    providers: [
        Credentials({
            async authorize(credentials) {
                const { email, password } = credentials;

                if (!email || !password) return null;

                const user = await prisma.user.findUnique({
                    where: { email: email as string },
                });

                if (!user || !user.password) return null;

                const passwordsMatch = await bcrypt.compare(
                    password as string,
                    user.password
                );

                if (passwordsMatch) return user;

                return null;
            },
        }),
    ],
} satisfies NextAuthConfig;
