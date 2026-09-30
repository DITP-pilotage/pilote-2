import { Badge, type BadgeType } from "@/components/_commons/Badge";
import type { MailleAnnuaire } from "@/server/annuaire/queries/personnesAnnuaire";

const NIVEAUX: Record<MailleAnnuaire, { libelle: string; type: BadgeType }> = {
  REG: { libelle: "Région", type: "gris" },
  DEPT: { libelle: "Département", type: "bleu" },
};

export function BadgeNiveau({ maille }: { maille: MailleAnnuaire }) {
  const niveau = NIVEAUX[maille];
  return <Badge type={niveau.type}>{niveau.libelle}</Badge>;
}
