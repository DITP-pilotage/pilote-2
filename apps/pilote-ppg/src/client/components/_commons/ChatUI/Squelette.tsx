import { clsxm } from "@/utils/clsxm";

export const Squelette = ({ className }: { className?: string }) => (
  <div
    aria-hidden="true"
    className={clsxm(
      "relative overflow-hidden bg-dsfr-contrast-grey",
      className,
    )}
  >
    <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
  </div>
);

export const SqueletteTexte = () => (
  <div className="flex flex-col gap-2.5">
    <Squelette className="h-3.5 w-[92%]" />
    <Squelette className="h-3.5 w-[78%]" />
    <Squelette className="h-3.5 w-[60%]" />
  </div>
);
