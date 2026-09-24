import { useId } from "react";
import { Badge } from "@/components/_commons/Badge";
import { clsxm } from "@/utils/clsxm";
import { GRILLE_INDICATEUR, LigneIndicateur } from "./LigneIndicateur";
import type { LigneIndicateurNonAJour } from "./useTableauIndicateursNonAJour";

export const CarteChantier = ({
  groupe,
}: {
  groupe: LigneIndicateurNonAJour;
}) => {
  const idTitre = useId();
  const { chantierId, chantierNom } = groupe.subRows[0].original;
  const nombre = groupe.subRows.length;

  return (
    <section
      aria-labelledby={idTitre}
      className="overflow-hidden rounded-xl border border-gray-200 bg-white"
    >
      <div className="flex flex-col gap-3 bg-gray-50 px-4 py-4 md:flex-row md:items-center md:px-6">
        <div className="flex flex-col gap-1 md:flex-1">
          <span className="text-xs text-dsfr-mention-grey">{chantierId}</span>
          <h2 className="fr-h6 fr-mb-0" id={idTitre}>
            {chantierNom}
          </h2>
        </div>
        <Badge type="rouge">
          {nombre} indicateur{nombre > 1 ? "s" : ""} non à jour
        </Badge>
        <a
          className="fr-link fr-text--sm"
          href={`/chantier/${chantierId}/NAT-FR`}
        >
          Voir le chantier
        </a>
      </div>
      <div
        aria-hidden
        className={clsxm(
          "hidden px-6 py-2 text-xs font-bold text-dsfr-mention-grey",
          GRILLE_INDICATEUR,
        )}
      >
        <span>Indicateur</span>
        <span>Mailles</span>
        <span>Territoires en retard</span>
        <span>Dernière valeur</span>
        <span>MAJ attendue</span>
        <span>Retard</span>
        <span />
      </div>
      <ul className="m-0 list-none p-0">
        {groupe.subRows.map((ligne) => (
          <LigneIndicateur key={ligne.id} ligne={ligne} />
        ))}
      </ul>
    </section>
  );
};
