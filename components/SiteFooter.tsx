import Link from "next/link";
import { routes } from "@/lib/routes";
import { auth } from "@/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faUser, faWandMagicSparkles, faRightToBracket } from "@fortawesome/pro-solid-svg-icons";

export async function SiteFooter() {
  const year = new Date().getFullYear();
  const session = await auth();

  return (
    <footer className="mt-auto border-t border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          © {year} Turdsout. Turns out, it’s Turdsout.
        </p>

        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-foreground">
          <Link href={routes.home} className="inline-flex items-center gap-2 hover:underline">
            <FontAwesomeIcon icon={faWandMagicSparkles} className="text-xs" />
            <span>Feed</span>
          </Link>
          {session?.user ? (
            <>
              <Link href={routes.newPost} className="inline-flex items-center gap-2 hover:underline">
                <FontAwesomeIcon icon={faPlus} className="text-xs" />
                <span>New post</span>
              </Link>
              <Link href={routes.me} className="inline-flex items-center gap-2 hover:underline">
                <FontAwesomeIcon icon={faUser} className="text-xs" />
                <span>Profile</span>
              </Link>
            </>
          ) : (
            <Link href={routes.signIn} className="inline-flex items-center gap-2 hover:underline">
              <FontAwesomeIcon icon={faRightToBracket} className="text-xs" />
              <span>Sign in</span>
            </Link>
          )}
        </nav>
      </div>
    </footer>
  );
}
