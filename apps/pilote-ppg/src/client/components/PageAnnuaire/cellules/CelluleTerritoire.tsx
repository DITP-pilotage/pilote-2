import type { TerritoireAnnuaire } from "@/server/annuaire/queries/personnesAnnuaire";

export function CelluleTerritoire({
  territoire,
}: {
  territoire: TerritoireAnnuaire;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium">{territoire.nom}</span>
      {territoire.maille === "DEPT" && (
        <span className="text-xs text-dsfr-mention-grey">
          {territoire.regionNom}
        </span>
      )}
    </div>
  );
}
