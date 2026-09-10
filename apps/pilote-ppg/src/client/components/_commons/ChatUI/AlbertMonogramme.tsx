import { SparklingIcon } from "@/components/_commons/Icones/SparklingIcon";
import { clsxm } from "@/utils/clsxm";

const TAILLES = {
  sm: "h-6 w-6 [&>svg]:h-3.5 [&>svg]:w-3.5",
  md: "h-7 w-7 [&>svg]:h-4 [&>svg]:w-4",
  lg: "h-10 w-10 [&>svg]:h-[22px] [&>svg]:w-[22px]",
} as const;

export const AlbertMonogramme = ({
  taille = "md",
  className,
}: {
  taille?: keyof typeof TAILLES;
  className?: string;
}) => (
  <span
    aria-hidden="true"
    className={clsxm(
      "flex shrink-0 items-center justify-center bg-primary text-white",
      TAILLES[taille],
      className,
    )}
  >
    <SparklingIcon fill="currentColor" />
  </span>
);
