import { Badge, type BadgeVariant } from "@/components/shared/Badge";
import type { MailleAnnuaire } from "@/server/annuaire/queries/personnesAnnuaire";

const NIVEAUX: Record<
  MailleAnnuaire,
  { libelle: string; variante: BadgeVariant }
> = {
  REG: { libelle: "Région", variante: "default" },
  DEPT: { libelle: "Département", variante: "info" },
};

export function BadgeNiveau({ maille }: { maille: MailleAnnuaire }) {
  const niveau = NIVEAUX[maille];
  return (
    <Badge size="sm" variant={niveau.variante}>
      {niveau.libelle}
    </Badge>
  );
}
