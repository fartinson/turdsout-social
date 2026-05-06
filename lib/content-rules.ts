export const POST_MAX_CHARS = 120;
export const POST_MIN_CHARS = 8;

const urlLike = /\bhttps?:\/\/|\bwww\./i;

export function validatePostBody(raw: string) {
  const body = raw.trim().replace(/\s+/g, " ");

  if (body.length < POST_MIN_CHARS) {
    return { ok: false as const, reason: `Keep it going—at least ${POST_MIN_CHARS} characters.` };
  }
  if (body.length > POST_MAX_CHARS) {
    return { ok: false as const, reason: `Too long—max ${POST_MAX_CHARS} characters.` };
  }
  if (urlLike.test(body)) {
    return { ok: false as const, reason: "Links are disabled for now." };
  }
  if (body.includes("@")) {
    return { ok: false as const, reason: "No @ mentions for now." };
  }

  return { ok: true as const, body };
}

