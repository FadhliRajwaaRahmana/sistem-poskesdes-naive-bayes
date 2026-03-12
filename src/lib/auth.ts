import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins/username";
import { prisma } from "@/lib/prisma";

const baseURL = process.env.BETTER_AUTH_URL;
const secret = process.env.BETTER_AUTH_SECRET;

if (!baseURL) {
  throw new Error("BETTER_AUTH_URL belum diatur.");
}

if (!secret) {
  throw new Error("BETTER_AUTH_SECRET belum diatur.");
}

export const auth = betterAuth({
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Sistem Diagnosa POSKESDES",
  baseURL,
  secret,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      role: {
        type: ["ADMIN"],
        required: false,
        defaultValue: "ADMIN",
        input: false,
      },
    },
  },
  plugins: [
    nextCookies(),
    username({
      minUsernameLength: 3,
      maxUsernameLength: 30,
    }),
  ],
  trustedOrigins: [baseURL, "http://127.0.0.1:3000", "http://localhost:3000"],
});

export type AuthSession = typeof auth.$Infer.Session;
