import { CSSProperties } from "react";
import { clsxm } from "@/utils/clsxm";
import { Progress } from "@/components/shared/Progress";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";

export type TerritoireProgressBarVariant = "progressBar" | "histogram";

export const TerritoireProgressBar = ({
  pourcentage,
  libelle,
  couleur,
  dateMaj,
  variant = "progressBar",
}: {
  pourcentage: number;
  libelle: string;
  couleur: string;
  dateMaj?: string | null;
  variant?: TerritoireProgressBarVariant;
}) => {
  const isHistogram = variant === "histogram";

  return (
    <>
      <Progress
        aria-label={libelle}
        className={clsxm(
          "mx-2 h-4 w-auto rounded-none bg-transparent",
          !isHistogram && "rounded-full bg-dsfr-grey-925",
        )}
        indicatorClassName={clsxm(
          "rounded-none bg-[var(--couleur-territoire)] transition-none",
          !isHistogram && "rounded-full",
        )}
        style={{ "--couleur-territoire": couleur } as CSSProperties}
        value={Math.min(pourcentage, 100)}
      />

      <div className="whitespace-nowrap text-left">
        <div style={{ color: couleur }}>{libelle}</div>
        {dateMaj != null && (
          <div className="text-[10px] !text-dsfr-grey-625">
            ({PiloteDateFormatter.isoMonthFranceMetropolitaine(dateMaj) ?? "—"})
          </div>
        )}
      </div>
    </>
  );
};
