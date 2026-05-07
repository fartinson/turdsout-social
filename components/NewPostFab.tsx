import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/pro-solid-svg-icons";
import { routes } from "@/lib/routes";

export function NewPostFab({ signedIn }: { signedIn: boolean }) {
  const href = signedIn ? routes.newPost : routes.signIn;
  const label = signedIn ? "Create a new post" : "Sign in to post";

  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="bg-primary text-primary-foreground focus:ring-accent fixed right-6 bottom-6 z-50 inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full shadow-lg shadow-black/10 transition hover:opacity-90 focus:ring-2 focus:outline-none dark:shadow-white/10"
    >
      <FontAwesomeIcon icon={faPenToSquare} className="text-lg" />
    </Link>
  );
}
