import { clsxm } from "@/utils/clsxm";
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
      <div
        className={clsxm(
          "h-4 mx-2",
          !isHistogram && "rounded-full bg-dsfr-grey-925",
        )}
      >
        <div
          className={clsxm("h-full", !isHistogram && "rounded-full")}
          style={{
            width: `${Math.min(pourcentage, 100)}%`,
            backgroundColor: couleur,
          }}
        />
      </div>

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
