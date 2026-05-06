import { cn } from "@/lib/cn";
import { RichText } from "@graphcms/rich-text-react-renderer";
import type { RichTextContent } from "@graphcms/rich-text-types";
import Link from "next/link";

export function isRichTextContent(value: unknown): value is RichTextContent {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.length > 0;
  const children = (value as { children?: unknown }).children;
  return Array.isArray(children) && children.length > 0;
}

type CmsRichTextProps = {
  content: RichTextContent;
  className?: string;
};

function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href) || href.startsWith("//");
}

/** Hygraph rich text (`raw`) via `@graphcms/rich-text-react-renderer`. Style with Tailwind Typography `prose` only. */
export function CmsRichText({ content, className }: CmsRichTextProps) {
  return (
    <div className={cn("prose prose-primary", className)}>
      <RichText
        content={content}
        renderers={{
          a: ({ children, openInNewTab, href, rel, ...rest }) => {
            if (!href) {
              return <span {...rest}>{children}</span>;
            }

            if (isExternalHref(href)) {
              return (
                <a
                  href={href}
                  target={openInNewTab ? "_blank" : "_self"}
                  rel={rel ?? "noopener noreferrer"}
                  {...rest}
                >
                  {children}
                </a>
              );
            }

            return (
              <Link href={href} {...rest}>
                {children}
              </Link>
            );
          },
        }}
      />
    </div>
  );
}
