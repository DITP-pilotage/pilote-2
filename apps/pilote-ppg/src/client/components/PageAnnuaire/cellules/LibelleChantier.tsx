import type { ChantierAnnuaire } from "@/server/annuaire/queries/ListerResponsablesAnnuaireQuery";

export const libelleChantier = (chantier: ChantierAnnuaire) =>
  `${chantier.id} - ${chantier.nom}`;

// Libellé limité à 2 lignes ; le libellé complet reste disponible au survol.
export function LibelleChantier({ chantier }: { chantier: ChantierAnnuaire }) {
  const libelle = libelleChantier(chantier);
  return (
    <span className="line-clamp-2 text-sm font-medium" title={libelle}>
      {libelle}
    </span>
  );
}
