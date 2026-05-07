"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useCallback, useId, useMemo, useState } from "react";

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

  if (!enabled) return null;

  return (
    <div className="mt-4">
      <input type="hidden" name={name} value={token} readOnly />
      <Turnstile
        key={widgetId}
        id={widgetId}
        className="border-border bg-background min-h-[65px] rounded-xl border p-3"
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
      <p className="text-muted mt-2 text-xs">
        Quick bot-check (only in production).
      </p>
      {loadError || !widgetLoaded ? (
        <div className="mt-3 rounded-xl border border-dashed border-border bg-surface p-3 text-xs text-muted">
          <p className="font-medium text-foreground">
            Bot-check didn&apos;t load.
          </p>
          <p className="mt-1">
            If you use an ad blocker / privacy shield, try disabling it for this
            site, then reload the check.
          </p>
          <button
            type="button"
            className="mt-2 inline-flex cursor-pointer items-center justify-center rounded-lg border border-border bg-background px-3 py-1.5 font-semibold text-foreground hover:bg-surface/60"
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
