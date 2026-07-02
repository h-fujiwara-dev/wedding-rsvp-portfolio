"use client";

import { type MouseEvent, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { usePageTransition } from "@/context/TransitionContext";
import { useLenis } from "@/context/LenisContext";

interface TransitionLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  "aria-label"?: string;
  "data-testid"?: string;
}

export function TransitionLink({
  href,
  children,
  className,
  onClick,
  ...rest
}: TransitionLinkProps) {
  const { navigate, status } = usePageTransition();
  const pathname = usePathname();
  const lenis = useLenis();

  // Lenis drives scroll via its own rAF loop, which fights back against
  // native scrollIntoView() and snaps the page back to its tracked position.
  // Route the scroll through Lenis so it becomes the source of truth.
  function scrollToId(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    if (lenis) lenis.scrollTo(el);
    else el.scrollIntoView({ behavior: "smooth" });
  }

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    onClick?.();

    // Anchor-only — just scroll
    if (href.startsWith("#")) {
      scrollToId(href.slice(1));
      return;
    }

    const [targetPath, anchor] = href.split("#");
    const normalizedPath = targetPath || "/";

    // Same page with anchor — just scroll
    if (normalizedPath === pathname && anchor) {
      scrollToId(anchor);
      return;
    }

    // Already on target page, no anchor — do nothing
    if (normalizedPath === pathname && !anchor) return;

    // Transition in progress — ignore
    if (status !== "idle") return;

    navigate(href);
  }

  return (
    <a href={href} onClick={handleClick} className={className} {...rest}>
      {children}
    </a>
  );
}
