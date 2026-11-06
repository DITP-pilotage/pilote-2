import {
  type ColonneDetail,
  libelleChantier,
  libelleIndicateur,
  type LigneDetail,
} from "@/components/_commons/ChatUI/detailIndicateursACompleter";
import { Badge, type BadgeVariant } from "@/components/shared/Badge";
import type { LibelleMotif } from "@/server/albert/tools/indicateursACompleter";

const VARIANTES_MOTIF: Record<LibelleMotif, BadgeVariant> = {
  "VA non à jour": "warning",
  "VI manquante": "info",
  "VC manquante": "default",
};

export const CelluleIndicateursACompleter = ({
  colonne,
  ligne,
}: {
  colonne: ColonneDetail;
  ligne: LigneDetail;
}) => {
  if (colonne.id === "motif")
    return (
      <Badge
        className="normal-case"
        size="sm"
        variant={VARIANTES_MOTIF[ligne.motif]}
      >
        {ligne.motif}
      </Badge>
    );
  // Le chantier n'a pas de colonne dans le tableau : son code précède l'indicateur.
  if (colonne.id === "indicateur")
    return (
      <span
        className="block truncate"
        title={`${libelleChantier(ligne)} · ${libelleIndicateur(ligne)}`}
      >
        <span className="text-dsfr-mention-grey">{ligne.chantier_id}</span>{" "}
        {libelleIndicateur(ligne)}
      </span>
    );
  if (colonne.id === "territoire")
    return (
      <span className="block truncate" title={colonne.valeur(ligne)}>
        {colonne.valeur(ligne)}
      </span>
    );
  return colonne.valeur(ligne);
};
