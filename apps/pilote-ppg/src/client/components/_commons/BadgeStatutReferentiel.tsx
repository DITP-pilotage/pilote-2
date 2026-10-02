import { Badge } from "@/components/shared/Badge";

export const BadgeStatutReferentiel = ({ supprimé }: { supprimé: boolean }) =>
  supprimé ? (
    <Badge size="sm" variant="error">
      Supprimé
    </Badge>
  ) : (
    <Badge size="sm" variant="success">
      Actif
    </Badge>
  );
