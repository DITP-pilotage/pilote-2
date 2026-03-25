import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";

export const TerritoireProgressBar = ({
  pourcentage,
  libelle,
  couleur,
  dateMaj,
}: {
  pourcentage: number;
  libelle: string;
  couleur: string;
  dateMaj?: string | null;
}) => (
  <>
    <div className="h-4 rounded-full bg-dsfr-grey-925 mx-2">
      <div
        className="h-full rounded-full"
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
