import Link from "next/link";
import { routes } from "@/lib/routes";
import { auth } from "@/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faUser,
  faWandMagicSparkles,
  faRightToBracket,
  faHandHoldingHeart,
} from "@fortawesome/pro-solid-svg-icons";

export async function SiteFooter() {
  const year = new Date().getFullYear();
  const session = await auth();

  return (
    <footer className="border-border/70 bg-background/80 mt-auto border-t backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted text-xs">© {year} Turdsout</p>

        <nav className="text-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold">
          <Link
            href={routes.home}
            className="inline-flex items-center gap-2 hover:underline"
          >
            <FontAwesomeIcon icon={faWandMagicSparkles} className="text-xs" />
            <span>Feed</span>
          </Link>
          {session?.user ? (
            <>
              <Link
                href={routes.newPost}
                className="inline-flex items-center gap-2 hover:underline"
              >
                <FontAwesomeIcon icon={faPlus} className="text-xs" />
                <span>New post</span>
              </Link>
              <Link
                href={routes.me}
                className="inline-flex items-center gap-2 hover:underline"
              >
                <FontAwesomeIcon icon={faUser} className="text-xs" />
                <span>Profile</span>
              </Link>
            </>
          ) : (
            <Link
              href={routes.signIn}
              className="inline-flex items-center gap-2 hover:underline"
            >
              <FontAwesomeIcon icon={faRightToBracket} className="text-xs" />
              <span>Sign in</span>
            </Link>
          )}

          <span className="text-muted">·</span>
          <Link
            href={routes.page("privacy-policy")}
            className="hover:underline"
          >
            Privacy
          </Link>
          <Link
            href={routes.page("terms-and-conditions")}
            className="hover:underline"
          >
            Terms
          </Link>
          <span className="text-muted">·</span>
          <Link
            href={routes.donate}
            className="inline-flex items-center gap-2 hover:underline"
          >
            <FontAwesomeIcon icon={faHandHoldingHeart} className="text-xs" />
            <span>Donate</span>
          </Link>
        </nav>
      </div>
    </footer>
  );
}
