import type { MailleAnnuaire } from "@/server/annuaire/queries/personnesAnnuaire";
import { clsxm } from "@/utils/clsxm";

const NIVEAUX: Record<MailleAnnuaire, { libelle: string; classes: string }> = {
  REG: {
    libelle: "Région",
    classes: "bg-dsfr-blue-france-950 text-primary ring-dsfr-blue-france-850",
  },
  DEPT: {
    libelle: "Département",
    classes: "bg-white text-dsfr-grey-200 ring-dsfr-grey-925",
  },
};

export function BadgeNiveau({ maille }: { maille: MailleAnnuaire }) {
  const niveau = NIVEAUX[maille];
  return (
    <span
      className={clsxm(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset whitespace-nowrap",
        niveau.classes,
      )}
    >
      {niveau.libelle}
    </span>
  );
}
