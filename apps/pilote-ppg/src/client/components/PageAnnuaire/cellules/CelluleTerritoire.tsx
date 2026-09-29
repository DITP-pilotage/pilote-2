import type { TerritoireAnnuaire } from "@/server/annuaire/queries/personnesAnnuaire";
import { BadgeNiveau } from "./BadgeNiveau";

export function CelluleTerritoire({
  territoire,
}: {
  territoire: TerritoireAnnuaire;
}) {
  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{territoire.nom}</span>
        {territoire.maille === "DEPT" && (
          <span className="text-xs text-dsfr-mention-grey">
            {territoire.regionNom}
          </span>
        )}
      </div>
      <BadgeNiveau maille={territoire.maille} />
    </div>
  );
}
