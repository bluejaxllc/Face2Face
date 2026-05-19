import { useEffect, useRef } from "react";

export const useScrollSave = (key: string) => {
  const isRestored = useRef(false);

  const ref = (node: HTMLDivElement | null) => {
    if (node && !isRestored.current) {
      const saved = localStorage.getItem(key);
      if (saved) {
        requestAnimationFrame(() => {
          setTimeout(() => {
            node.scrollTop = Number(saved);
          }, 50);
        });
      }
      isRestored.current = true;
    } else if (!node) {
      isRestored.current = false;
    }
  };

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    localStorage.setItem(key, e.currentTarget.scrollTop.toString());
  };

  return { ref, onScroll };
};
