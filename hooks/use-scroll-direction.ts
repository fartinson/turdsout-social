"use client";

import { useEffect, useRef, useState } from "react";

export function useScrollDirection({
  revealOffset = 8,
  minHideY = 80,
}: { revealOffset?: number; minHideY?: number } = {}) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY;

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = Math.abs(y - lastY.current);

        if (delta > revealOffset) {
          const scrollingDown = y > lastY.current;
          if (scrollingDown && y > minHideY) setHidden(true);
          else setHidden(false);

          lastY.current = y;
        }

        ticking.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [revealOffset, minHideY]);

  return hidden;
}
