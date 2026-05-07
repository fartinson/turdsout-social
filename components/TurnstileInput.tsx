"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useCallback, useEffect, useId, useMemo, useState } from "react";

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
  const enabled = shouldEnable();
  const [token, setToken] = useState("");
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [trusted, setTrusted] = useState<boolean | null>(null);
  const reactId = useId();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  const widgetId = useMemo(
    () => `turnstile-${reactId}-${reloadNonce}`,
    [reactId, reloadNonce],
  );

  const onSuccess = useCallback(
    (t: string) => {
      setToken(t);
      onToken?.(t);
    },
    [onToken],
  );

  const clearToken = useCallback(() => {
    setToken("");
    onToken?.("");
  }, [onToken]);

  useEffect(() => {
    let cancelled = false;
    async function checkTrusted() {
      // Only relevant when Turnstile is enabled (prod).
      if (!enabled) return;
      try {
        const res = await fetch("/api/turnstile/trust", { method: "GET" });
        const data = (await res.json().catch(() => null)) as {
          trusted?: boolean;
        } | null;
        if (!cancelled) setTrusted(Boolean(data?.trusted));
      } catch {
        if (!cancelled) setTrusted(false);
      }
    }
    checkTrusted();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  if (!enabled) return null;
  if (trusted === true) return null;

  const showWidget = token.length === 0;

  return (
    <div className="mt-4">
      <input type="hidden" name={name} value={token} readOnly />
      {showWidget ? (
        <Turnstile
          key={widgetId}
          id={widgetId}
          className="bg-background min-h-[65px] rounded-xl"
          siteKey={siteKey}
          options={{ appearance: "interaction-only" }}
          onLoadScript={() => {
            setLoadError(false);
          }}
          scriptOptions={{
            onError: () => {
              setLoadError(true);
            },
          }}
          onWidgetLoad={() => {
            setWidgetLoaded(true);
            setLoadError(false);
          }}
          onSuccess={onSuccess}
          onExpire={clearToken}
          onTimeout={clearToken}
          onUnsupported={() => {
            setLoadError(true);
            clearToken();
          }}
          onError={(err) => {
            // In the wild this is often ad/tracker blocking of challenges.cloudflare.com.
            // We keep this visible to users via the fallback UI below.
            console.warn("Turnstile error:", err);
            setLoadError(true);
            clearToken();
          }}
        />
      ) : null}

      {showWidget && (loadError || !widgetLoaded) ? (
        <div className="border-border bg-surface text-muted mt-3 rounded-xl border border-dashed p-3 text-xs">
          <p className="text-foreground font-medium">
            Bot-check didn&apos;t load.
          </p>
          <p className="mt-1">
            If you use an ad blocker / privacy shield, try disabling it for this
            site, then reload the check.
          </p>
          <button
            type="button"
            className="border-border bg-background text-foreground hover:bg-surface/60 mt-2 inline-flex cursor-pointer items-center justify-center rounded-lg border px-3 py-1.5 font-semibold"
            onClick={() => {
              setWidgetLoaded(false);
              setLoadError(false);
              clearToken();
              setReloadNonce((n) => n + 1);
            }}
          >
            Reload bot-check
          </button>
        </div>
      ) : null}
    </div>
  );
}
