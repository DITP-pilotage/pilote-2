import { Badge } from "@/components/_commons/Badge";

export const BadgeStatutReferentiel = ({ supprimé }: { supprimé: boolean }) =>
  supprimé ? (
    <Badge type="rouge">Supprimé</Badge>
  ) : (
    <Badge type="vert">Actif</Badge>
  );
