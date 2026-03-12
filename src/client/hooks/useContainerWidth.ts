import { RefObject, useEffect, useState } from "react";

export const useContainerWidth = (
  ref: RefObject<HTMLElement | null>,
): number | null => {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const contentBoxSize = entry.contentBoxSize[0];
        setWidth(contentBoxSize.inlineSize);
      }
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return width;
};
