import { Badge } from "@/components/_commons/Badge";
import { clsxm } from "@/utils/clsxm";
import { EnveloppeCarteChantier } from "./EnveloppeCarteChantier";
import { GRILLE_INDICATEUR, LigneIndicateur } from "./LigneIndicateur";
import type { LigneIndicateurNonAJour } from "./useTableauIndicateursNonAJour";

export const CarteChantier = ({
  groupe,
}: {
  groupe: LigneIndicateurNonAJour;
}) => {
  const { chantierId, chantierNom } = groupe.subRows[0].original;
  const nombre = groupe.subRows.length;

  return (
    <EnveloppeCarteChantier
      badge={
        <Badge type="rouge">
          {nombre} indicateur{nombre > 1 ? "s" : ""} non à jour
        </Badge>
      }
      chantierId={chantierId}
      chantierNom={chantierNom}
    >
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
    </EnveloppeCarteChantier>
  );
};
