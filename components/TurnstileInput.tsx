"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useId, useState } from "react";

function shouldEnable() {
  return (
    process.env.NODE_ENV === "production" &&
    Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
  );
}

export function TurnstileInput({
  name,
  onToken,
}: {
  name: string;
  onToken?: (token: string) => void;
}) {
  const [token, setToken] = useState("");
  const reactId = useId();

  if (!shouldEnable()) return null;

  return (
    <div className="mt-4">
      <input type="hidden" name={name} value={token} readOnly />
      <Turnstile
        id={`turnstile-${reactId}`}
        className="border-border bg-background min-h-[65px] rounded-xl border p-3"
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        options={{ appearance: "interaction-only" }}
        onSuccess={(t) => {
          setToken(t);
          onToken?.(t);
        }}
        onExpire={() => {
          setToken("");
          onToken?.("");
        }}
        onError={() => {
          setToken("");
          onToken?.("");
        }}
      />
      <p className="text-muted mt-2 text-xs">
        Quick bot-check (only in production).
      </p>
    </div>
  );
}
