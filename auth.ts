import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import { env } from "@/env";
import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { UserProfile } from "@/models/UserProfile";
import { defaultHandleFromEmail, withSuffix } from "@/lib/handle";

const hasAuthEnv = Boolean(
  env.AUTH_SECRET && env.AUTH_RESEND_KEY && env.AUTH_EMAIL_FROM,
);

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
          async sendVerificationRequest(params) {
            const { identifier: to, url } = params;
            const original = new URL(url);
            const continueUrl = new URL("/signin/continue", original.origin);
            for (const key of ["token", "email", "callbackUrl"]) {
              const value = original.searchParams.get(key);
              if (value) continueUrl.searchParams.set(key, value);
            }

            const host = continueUrl.host;
            const subject = `Sign in to ${host}`;
            const html = `
              <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;">
                <h2 style="margin:0 0 12px 0;">Sign in to ${host}</h2>
                <p style="margin:0 0 16px 0; line-height:1.4;">
                  Click the button below to finish signing in.
                </p>
                <p style="margin:0 0 16px 0;">
                  <a href="${continueUrl.toString()}" style="display:inline-block; background:#0d4f5c; color:#f8fafc; padding:10px 14px; border-radius:12px; text-decoration:none; font-weight:700;">
                    Continue sign in
                  </a>
                </p>
                <p style="margin:0; color:#64748b; font-size:12px; line-height:1.4;">
                  If you didn’t request this email, you can safely ignore it.
                </p>
              </div>
            `.trim();
            const text = `Sign in to ${host}\n\nContinue: ${continueUrl.toString()}\n\nIf you didn’t request this email, ignore it.`;

            const res = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${env.AUTH_RESEND_KEY!}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: env.AUTH_EMAIL_FROM!,
                to,
                subject,
                html,
                text,
              }),
            });

            if (!res.ok) {
              throw new Error(
                `Resend error: ${JSON.stringify(await res.json().catch(() => null))}`,
              );
            }
          },
        }),
      ],
      pages: {
        signIn: "/signin",
        verifyRequest: "/signin/check-email",
        newUser: "/me",
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
            const exists = await UserProfile.findOne({ handle: handleToInsert })
              .select({ _id: 1 })
              .lean();
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
            { upsert: true },
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
    { status: 500 },
  );

export const GET = nextAuth?.handlers.GET ?? missingAuthEnvResponse;
export const POST = nextAuth?.handlers.POST ?? missingAuthEnvResponse;

export const auth = nextAuth?.auth ?? (async () => null);
export const signIn =
  nextAuth?.signIn ?? (async () => missingAuthEnvResponse());
export const signOut =
  nextAuth?.signOut ?? (async () => missingAuthEnvResponse());
