"use client";

import { useFormStatus } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faSpinner } from "@fortawesome/pro-solid-svg-icons";

export function SignInSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-primary text-primary-foreground inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
          <span>Sending…</span>
        </>
      ) : (
        <>
          <span>Send me a link</span>
          <FontAwesomeIcon icon={faEnvelope} />
        </>
      )}
    </button>
  );
}
