import { ReactNode } from "react";
import { Infobulle } from "@/components/shared/Infobulle";
import { Progress } from "@/components/shared/Progress";
import { clsxm } from "@/utils/clsxm";

export type ProgressBarVariant =
  | "primary"
  | "primary-light"
  | "secondary"
  | "secondary-light"
  | "pink"
  | "mustard"
  | "light-blue"
  | "info"
  | "grey";
type ProgressBarSize = "xxs" | "xs" | "sm" | "md" | "lg";
type ProgressBarBackground = "blue" | "white" | "medium-grey" | "light-grey";
type ProgressBarBorder = "blue" | "medium-grey" | null;
type ProgressBarLabelPosition = "side" | "top";

const HEIGHTS: Record<ProgressBarSize, string> = {
  xxs: "h-2",
  xs: "h-2.5",
  sm: "h-3",
  md: "h-3",
  lg: "h-8",
};

const BACKGROUNDS: Record<ProgressBarBackground, string> = {
  blue: "bg-dsfr-blue-ecume-850",
  white: "bg-white",
  "medium-grey": "bg-pilote-gris-moyen",
  "light-grey": "bg-dsfr-grey-925",
};

const BORDERS: Record<Exclude<ProgressBarBorder, null>, string> = {
  blue: "border border-dsfr-blue-ecume-850",
  "medium-grey": "border border-pilote-gris-moyen",
};

const VARIANTS: Record<ProgressBarVariant, string> = {
  primary: "bg-primary",
  "primary-light": "bg-dsfr-blue-france-sun-113",
  secondary: "bg-dsfr-mention-grey",
  "secondary-light": "bg-dsfr-grey-625",
  pink: "bg-dsfr-pink-tuile-main-556",
  mustard: "bg-dsfr-moutarde-main-679",
  "light-blue": "bg-dsfr-flat-info",
  info: "bg-dsfr-info-main-525",
  grey: "bg-dsfr-grey-200",
};

const LABEL_WIDTHS: Record<ProgressBarSize, string> = {
  xxs: "w-10",
  xs: "w-10",
  sm: "w-10",
  md: "w-10",
  lg: "w-[6.5rem]",
};

// Les tailles de texte gardent les classes du DSFR : l'impression de la fiche
// territoriale les cible pour réduire les textes.
const LABEL_SIZES: Record<ProgressBarSize, string> = {
  xxs: "fr-text--xs",
  xs: "fr-text--xs",
  sm: "fr-text--xs",
  md: "fr-text--sm",
  lg: "text-h1 md:text-h1-md font-bold text-dsfr-grey-50",
};

interface ProgressBarProps {
  size: ProgressBarSize;
  variant: ProgressBarVariant;
  background?: ProgressBarBackground;
  border?: ProgressBarBorder;
  value: number | null;
  labelPosition?: ProgressBarLabelPosition;
  showLabel?: boolean;
  tooltip?: ReactNode;
  centerLabel?: boolean;
}

export const ProgressBar = ({
  size,
  variant,
  background = "medium-grey",
  border = "medium-grey",
  labelPosition = "side",
  value,
  showLabel = true,
  tooltip,
  centerLabel = false,
}: ProgressBarProps) => {
  const label = value === null ? "- %" : `${value.toFixed(0)} %`;

  return (
    <div
      className={clsxm(
        "flex w-full",
        labelPosition === "side" && "flex-row items-center",
        labelPosition === "top" && "flex-col-reverse",
      )}
    >
      <div className="grow">
        <Progress
          className={clsxm(
            HEIGHTS[size],
            BACKGROUNDS[background],
            border && BORDERS[border],
          )}
          indicatorClassName={value ? VARIANTS[variant] : undefined}
          max={100}
          value={value ?? 0}
        />
      </div>
      {showLabel ? (
        <div
          className={clsxm(
            "flex",
            labelPosition === "side" && LABEL_WIDTHS[size],
            centerLabel ? "justify-center" : "justify-between",
          )}
        >
          <p
            className={clsxm(
              "mb-0 font-bold mr-2 whitespace-nowrap align-middle",
              LABEL_SIZES[size],
              labelPosition === "side" && "pl-2 text-right",
            )}
          >
            {label}
          </p>
          {tooltip ? (
            <Infobulle styleIconInfoBulle="question">
              <p className="fr-text--sm fr-text-title--blue-france">
                Taux d'avancement :
              </p>
              <p className="fr-text--sm fr-mb-0">{tooltip}</p>
            </Infobulle>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
