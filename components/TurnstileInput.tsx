"use client";

import { useEffect, useId, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          appearance?: "always" | "execute" | "interaction-only";
        }
      ) => string;
      reset: (widgetId: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function shouldEnable() {
  return process.env.NODE_ENV === "production" && Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

function loadTurnstileScript() {
  if (!shouldEnable()) return;
  if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;

  const script = document.createElement("script");
  script.src = SCRIPT_SRC;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

export function TurnstileInput({ name, onToken }: { name: string; onToken?: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [token, setToken] = useState("");
  const reactId = useId();

  useEffect(() => {
    if (!shouldEnable()) return;
    loadTurnstileScript();

    let cancelled = false;
    const start = Date.now();

    const tryRender = () => {
      if (cancelled) return;
      if (!containerRef.current) return;
      if (!window.turnstile?.render) {
        if (Date.now() - start < 8000) {
          requestAnimationFrame(tryRender);
        }
        return;
      }

      if (widgetIdRef.current) return;

      const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey,
        callback: (t) => {
          setToken(t);
          onToken?.(t);
        },
        "expired-callback": () => {
          setToken("");
          onToken?.("");
        },
        "error-callback": () => {
          setToken("");
          onToken?.("");
        },
        appearance: "interaction-only",
      });
    };

    tryRender();

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile?.reset) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch {
          // ignore
        }
      }
      widgetIdRef.current = null;
    };
  }, []);

  if (!shouldEnable()) return null;

  return (
    <div className="mt-4">
      <input type="hidden" name={name} value={token} readOnly />
      <div
        ref={containerRef}
        id={`turnstile-${reactId}`}
        className="min-h-[65px] rounded-xl border border-border bg-background p-3"
      />
      <p className="mt-2 text-xs text-muted">Quick bot-check (only in production).</p>
    </div>
  );
}

