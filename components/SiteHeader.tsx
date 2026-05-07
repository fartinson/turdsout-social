"use client";

import Link from "next/link";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { routes } from "@/lib/routes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPenToSquare,
  faUser,
  faWandMagicSparkles,
} from "@fortawesome/pro-solid-svg-icons";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type NavLinkProps = React.ComponentProps<typeof Link> & {
  className?: string;
  children: React.ReactNode;
};

const NavLink = ({ href, children, className, ...props }: NavLinkProps) => {
  const pathname = usePathname();
  const isActive = typeof href === "string" ? pathname === href : false;
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-3 py-2",
        isActive
          ? "text-primary bg-primary/10 cursor-default"
          : "text-foreground hover:bg-surface/70 cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
};

export function SiteHeader() {
  const hidden = useScrollDirection({ revealOffset: 10, minHideY: 72 });

  return (
    <header
      className={cn(
        "border-border/70 bg-background/80 sticky top-0 z-50 border-b backdrop-blur transition-transform duration-300 ease-out",
        hidden ? "-translate-y-full" : "translate-y-0",
      )}
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link
          href={routes.home}
          className="text-primary [font-family:var(--font-fraunces)] text-xl font-medium tracking-tight"
        >
          Turdsout
        </Link>

        <nav className="text-foreground flex items-center gap-1 text-sm font-semibold">
          <NavLink href={routes.home} aria-label="Feed">
            <FontAwesomeIcon icon={faWandMagicSparkles} />
          </NavLink>
          <NavLink href={routes.newPost} aria-label="New">
            <FontAwesomeIcon icon={faPenToSquare} />
          </NavLink>
          <NavLink href={routes.me} aria-label="My profile">
            <FontAwesomeIcon icon={faUser} />
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
