import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { api } from "@/server/framework/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { toISODate } from "@/server/app/domain/Dates";
import {
  periodesChevauchees,
  schemaPeriode,
  type Bornes,
  type SaisiePeriode,
} from "@/server/formations/domain/periodeInformation";
import type { PeriodeInformation } from "@/server/formations/queries/ListPeriodesInformationQuery";
import { listerPeriodes } from "./formaterPeriodes";

const TOAST_OPTIONS = {
  duration: 5000,
  position: "top-right",
  richColors: true,
} as const;

function messageEnregistrement(periodesRemplacees: Bornes[]): string {
  if (periodesRemplacees.length === 0) return "Période enregistrée.";
  if (periodesRemplacees.length === 1) {
    return `Période enregistrée. Celle ${listerPeriodes(periodesRemplacees)} a été supprimée.`;
  }
  return `Période enregistrée. Celles ${listerPeriodes(periodesRemplacees)} ont été supprimées.`;
}

export const usePeriodeInformationForm = ({
  periode,
  periodes,
  onClose,
}: {
  periode: PeriodeInformation | null;
  periodes: PeriodeInformation[];
  onClose: () => void;
}) => {
  const utils = api.useUtils();
  const aujourdhui = toISODate(new Date());

  const reactHookForm = useForm<SaisiePeriode>({
    resolver: zodResolver(
      schemaPeriode({
        aujourdhui,
        periodeEnCours: periode?.statut === "EN_COURS" ? periode : null,
      }),
    ),
    defaultValues: {
      dateDebut: periode?.dateDebut ?? "",
      dateFin: periode?.dateFin ?? "",
      motifIds:
        periode?.motifs
          .filter((motif) => !motif.retiree)
          .map((motif) => motif.id) ?? [],
    },
  });

  const [dateDebut, dateFin] = reactHookForm.watch(["dateDebut", "dateFin"]);
  const periodesRemplacees =
    dateDebut && dateFin && dateDebut <= dateFin
      ? periodesChevauchees(
          { dateDebut, dateFin },
          periodes.filter(
            (autre) =>
              autre.id !== periode?.id &&
              (autre.statut === "A_VENIR" || autre.statut === "EN_COURS"),
          ),
        ).toSorted((premiere, seconde) =>
          premiere.dateDebut.localeCompare(seconde.dateDebut),
        )
      : [];

  const savePeriode = api.formation.savePeriodeInformation.useMutation({
    onSuccess: async ({ periodesRemplacees: remplacees }) => {
      await utils.formation.periodesInformation.invalidate();
      toast.success(messageEnregistrement(remplacees), TOAST_OPTIONS);
      onClose();
    },
    onError: (error) => toast.error(error.message, TOAST_OPTIONS),
  });

  const enregistrer = reactHookForm.handleSubmit((saisie) => {
    if (savePeriode.isPending) return;
    savePeriode.mutate({
      id: periode?.id ?? null,
      ...saisie,
      csrf: récupérerUnCookie("csrf") ?? "",
    });
  });

  return { reactHookForm, enregistrer, periodesRemplacees, aujourdhui };
};
