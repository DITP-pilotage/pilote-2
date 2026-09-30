import { Badge, type VarianteBadge } from "@/components/shared/Badge";
import type { MailleAnnuaire } from "@/server/annuaire/queries/personnesAnnuaire";

const NIVEAUX: Record<
  MailleAnnuaire,
  { libelle: string; variante: VarianteBadge }
> = {
  REG: { libelle: "Région", variante: "defaut" },
  DEPT: { libelle: "Département", variante: "info" },
};

export function BadgeNiveau({ maille }: { maille: MailleAnnuaire }) {
  const niveau = NIVEAUX[maille];
  return (
    <Badge taille="sm" variante={niveau.variante}>
      {niveau.libelle}
    </Badge>
  );
}
