import { clsxm } from "@/utils/clsxm";

export const PointsAttente = ({ className }: { className?: string }) => (
  <span
    aria-hidden="true"
    className={clsxm("inline-flex items-center gap-1", className)}
  >
    <span className="h-1.5 w-1.5 bg-primary animate-pulse-square" />
    <span className="h-1.5 w-1.5 bg-primary animate-pulse-square [animation-delay:0.2s]" />
    <span className="h-1.5 w-1.5 bg-primary animate-pulse-square [animation-delay:0.4s]" />
  </span>
);
