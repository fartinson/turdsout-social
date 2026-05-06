import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import { env } from "@/env";
import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { UserProfile } from "@/models/UserProfile";
import { defaultHandleFromEmail, withSuffix } from "@/lib/handle";

const hasAuthEnv = Boolean(env.AUTH_SECRET && env.AUTH_RESEND_KEY && env.AUTH_EMAIL_FROM);

const nextAuth = hasAuthEnv
  ? NextAuth({
      secret: env.AUTH_SECRET,
      adapter: MongoDBAdapter(clientPromise, {
        databaseName: env.MONGODB_DB,
      }),
      providers: [
        Resend({
          apiKey: env.AUTH_RESEND_KEY!,
          from: env.AUTH_EMAIL_FROM!,
        }),
      ],
      pages: {
        signIn: "/signin",
        verifyRequest: "/signin/check-email",
      },
      session: {
        strategy: "database",
      },
      callbacks: {
        async session({ session, user }) {
          if (session.user) {
            // Ensure session.user.id is always present for app logic.
            // next-auth v5 passes `user` for database sessions.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (session.user as any).id = user.id;
          }
          return session;
        },
      },
      events: {
        async createUser(message) {
          const { user } = message;
          if (!user?.id || !user?.email) return;

          // This only fires after the user has successfully verified the magic link
          // (i.e. a real user row was created), not when the email is requested.
          await connectMongoose();
          const baseHandle = defaultHandleFromEmail(user.email);
          let handleToInsert = baseHandle;
          if (handleToInsert) {
            const exists = await UserProfile.findOne({ handle: handleToInsert }).select({ _id: 1 }).lean();
            if (exists) {
              const suffix = Math.random().toString(36).slice(2, 6);
              handleToInsert = withSuffix(handleToInsert, suffix);
            }
          }

          await UserProfile.updateOne(
            { userId: user.id },
            {
              $setOnInsert: {
                userId: user.id,
                email: user.email,
                handle: handleToInsert,
              },
            },
            { upsert: true }
          );
        },
      },
    })
  : null;

const missingAuthEnvResponse = () =>
  NextResponse.json(
    {
      error:
        "Auth is not configured. Set AUTH_SECRET, AUTH_RESEND_KEY, and AUTH_EMAIL_FROM in your environment variables.",
    },
    { status: 500 }
  );

export const GET = nextAuth?.handlers.GET ?? missingAuthEnvResponse;
export const POST = nextAuth?.handlers.POST ?? missingAuthEnvResponse;

export const auth = nextAuth?.auth ?? (async () => null);
export const signIn = nextAuth?.signIn ?? (async () => missingAuthEnvResponse());
export const signOut = nextAuth?.signOut ?? (async () => missingAuthEnvResponse());

