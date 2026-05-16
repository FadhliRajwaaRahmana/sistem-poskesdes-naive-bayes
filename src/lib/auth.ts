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
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Sistem Diagnosis Gizi Buruk Anak",
  baseURL,
  secret,
  database: prismaAdapter(prisma, {
    provider: "mysql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      role: {
        type: ["ADMIN", "USER"],
        required: false,
        defaultValue: "USER",
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
