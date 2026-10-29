import type { VueAssistant } from "@/components/_commons/ChatUI/affichageAssistant";
import { clsxm } from "@/utils/clsxm";

// La page, et la place qu'y prend l'assistant.
const PLACE_DE_L_ASSISTANT: Record<
  VueAssistant,
  { x: number; y: number; width: number; height: number }
> = {
  sidePanel: { x: 14, y: 4, width: 7, height: 16 },
  floating: { x: 12, y: 12, width: 6, height: 5 },
  modal: { x: 6, y: 7, width: 12, height: 10 },
};

export const PictogrammeVue = ({
  vue,
  className,
}: {
  vue: VueAssistant;
  className?: string;
}) => (
  <svg
    aria-hidden="true"
    className={clsxm("h-[18px] w-[18px] shrink-0", className)}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <rect height="16" width="18" x="3" y="4" />
    <rect fill="currentColor" stroke="none" {...PLACE_DE_L_ASSISTANT[vue]} />
  </svg>
);
