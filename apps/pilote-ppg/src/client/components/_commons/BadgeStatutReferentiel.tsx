import { Badge } from "@/components/shared/Badge";

export const BadgeStatutReferentiel = ({ supprimé }: { supprimé: boolean }) =>
  supprimé ? (
    <Badge taille="sm" variante="erreur">
      Supprimé
    </Badge>
  ) : (
    <Badge taille="sm" variante="succes">
      Actif
    </Badge>
  );
