import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { env } from "@/env";
import { connectMongoose } from "@/lib/mongoose";
import { UserProfile } from "@/models/UserProfile";
import { AppleLink } from "@/models/AppleLink";
import { defaultHandleFromEmail, withSuffix } from "@/lib/handle";

async function mongoDb() {
  const client = await clientPromise;
  return client.db(env.MONGODB_DB);
}

export async function getUserIdForAppleSub(
  appleSub: string,
): Promise<string | null> {
  await connectMongoose();
  const link = await AppleLink.findOne({ appleSub }).lean();
  return link ? String(link.userId) : null;
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const db = await mongoDb();
  const u = await db.collection("users").findOne({ email });
  return u?._id ? u._id.toHexString() : null;
}

/**
 * Links Apple to an existing email user (Resend sign-in) or creates a new user.
 */
export async function ensureAppleLinkedUser(opts: {
  appleSub: string;
  emailFromApple?: string | null;
}): Promise<string> {
  const existing = await getUserIdForAppleSub(opts.appleSub);
  if (existing) return existing;

  await connectMongoose();

  const emailFromToken =
    typeof opts.emailFromApple === "string"
      ? opts.emailFromApple.trim().toLowerCase()
      : "";

  if (emailFromToken) {
    const byEmail = await findUserIdByEmail(emailFromToken);
    if (byEmail) {
      const db = await mongoDb();
      try {
        await db.collection("accounts").insertOne({
          userId: new ObjectId(byEmail),
          type: "oauth",
          provider: "apple",
          providerAccountId: opts.appleSub,
        });
      } catch {
        // duplicate provider — ignore
      }
      await AppleLink.create({
        appleSub: opts.appleSub,
        userId: byEmail,
      });
      return byEmail;
    }
  }

  const syntheticEmail = `apple_${hashEmailSafe(opts.appleSub)}@invalid.turdsout.local`;
  const db = await mongoDb();
  const userId = new ObjectId();

  await db.collection("users").insertOne({
    _id: userId,
    email: syntheticEmail,
    emailVerified: new Date(),
    name: null,
    image: null,
  });

  await db.collection("accounts").insertOne({
    userId: userId,
    type: "oauth",
    provider: "apple",
    providerAccountId: opts.appleSub,
  });

  await AppleLink.create({
    appleSub: opts.appleSub,
    userId: userId.toHexString(),
  });

  const baseHandle = defaultHandleFromEmail(syntheticEmail);
  let handleToInsert = baseHandle;
  if (handleToInsert) {
    const exists = await UserProfile.findOne({
      handle: handleToInsert,
    })
      .select({ _id: 1 })
      .lean();
    if (exists) {
      const suffix = Math.random().toString(36).slice(2, 6);
      handleToInsert = withSuffix(handleToInsert, suffix);
    }
  }

  await UserProfile.updateOne(
    { userId: userId.toHexString() },
    {
      $setOnInsert: {
        userId: userId.toHexString(),
        email: syntheticEmail,
        handle: handleToInsert,
      },
    },
    { upsert: true },
  );

  return userId.toHexString();
}

function hashEmailSafe(appleSub: string) {
  return appleSub.replace(/[^a-z0-9]+/gi, "_").slice(0, 48);
}
