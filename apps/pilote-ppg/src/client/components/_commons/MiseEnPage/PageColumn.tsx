import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { useAlbertConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";
import { clsxm } from "@/utils/clsxm";

const NARROW_PAGE_WIDTH_PX = 1248;

export const PageColumn = ({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) => {
  const { display } = useAlbertConversation();
  const columnRef = useRef<HTMLDivElement>(null);
  const [isNarrow, setIsNarrow] = useState(false);
  const sidePanelOpen = display === "sidePanel";

  useEffect(() => {
    const column = columnRef.current;
    if (!column || !sidePanelOpen) return;

    const observer = new ResizeObserver(([entry]) => {
      setIsNarrow(entry.contentRect.width < NARROW_PAGE_WIDTH_PX);
    });
    observer.observe(column);
    return () => observer.disconnect();
  }, [sidePanelOpen]);

  return (
    <div
      className={clsxm("group/page", className)}
      data-narrow={sidePanelOpen && isNarrow ? "" : undefined}
      ref={columnRef}
    >
      {children}
    </div>
  );
};
