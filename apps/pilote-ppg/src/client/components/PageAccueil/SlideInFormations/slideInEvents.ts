import type { TrackedEvent } from "@/client/analytics/useAnalytics";
import type {
  FormationProposee,
  PeriodeProposee,
} from "@/server/formations/queries/GetFormationsAProposerQuery";

export const libellePeriode = (periode: PeriodeProposee): string =>
  `${periode.dateDebut} → ${periode.dateFin}`;

export const slideInEvent = (
  action: "view" | "minimize" | "close",
  periode: PeriodeProposee,
): TrackedEvent => ({
  category: "formations",
  action,
  name: `slide_in.${action}`,
  dimensions: { periode_information: libellePeriode(periode) },
});

export const inscriptionEvent = (
  periode: PeriodeProposee,
  formation: FormationProposee,
): TrackedEvent => ({
  category: "formations",
  action: "select",
  name: "inscription.click",
  dimensions: {
    periode_information: libellePeriode(periode),
    formation: formation.nom,
  },
});
