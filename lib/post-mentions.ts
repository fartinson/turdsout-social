import { UserProfile } from "@/models/UserProfile";
import { MAX_POST_MENTIONS } from "@/lib/post-mention-policy";

export { MAX_POST_MENTIONS } from "@/lib/post-mention-policy";

export type MentionProfileLite = {
  userId: string;
  handle: string | null;
  displayName: string | null;
};

export function normalizeMentionUserIdsInput(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of raw) {
    if (typeof x !== "string") continue;
    const id = x.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= MAX_POST_MENTIONS) break;
  }
  return out;
}

export async function loadMentionProfilesMap(
  userIds: string[],
): Promise<Map<string, MentionProfileLite>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return new Map();

  const rows = await UserProfile.find({ userId: { $in: unique } })
    .select({ userId: 1, handle: 1, displayName: 1 })
    .lean();

  return new Map(
    rows.map((p) => [
      String(p.userId),
      {
        userId: String(p.userId),
        handle: p.handle ?? null,
        displayName: p.displayName ?? null,
      },
    ]),
  );
}

export async function validateMentionsForCreate(
  authorUserId: string,
  candidateIds: string[],
): Promise<{ ok: true; ids: string[] } | { ok: false; error: string }> {
  if (candidateIds.length > MAX_POST_MENTIONS) {
    return {
      ok: false,
      error: `You can tag at most ${MAX_POST_MENTIONS} people per turd.`,
    };
  }

  if (candidateIds.some((id) => id === authorUserId)) {
    return { ok: false, error: "You can’t tag yourself." };
  }

  if (!candidateIds.length) {
    return { ok: true, ids: [] };
  }

  const profiles = await UserProfile.find({
    userId: { $in: candidateIds },
  })
    .select({ userId: 1 })
    .lean();

  if (profiles.length !== candidateIds.length) {
    return {
      ok: false,
      error: "One or more tagged users could not be found.",
    };
  }

  return { ok: true, ids: candidateIds };
}
