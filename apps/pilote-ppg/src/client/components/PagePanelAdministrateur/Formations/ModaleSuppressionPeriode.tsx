import { toast } from "sonner";
import { api } from "@/server/framework/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { Button } from "@/components/shared/Button";
import { Modale } from "@/components/shared/Modale";
import type { PeriodeInformation } from "@/server/formations/queries/ListPeriodesInformationQuery";
import { formaterJour } from "./formaterPeriodes";

const TOAST_OPTIONS = {
  duration: 3000,
  position: "top-right",
  richColors: true,
} as const;

export const ModaleSuppressionPeriode = ({
  periode,
  onClose,
}: {
  periode: PeriodeInformation;
  onClose: () => void;
}) => {
  const utils = api.useUtils();
  const deletePeriode = api.formation.deletePeriodeInformation.useMutation({
    onSuccess: async () => {
      await utils.formation.periodesInformation.invalidate();
      toast.success("Période supprimée.", TOAST_OPTIONS);
      onClose();
    },
    onError: (error) => toast.error(error.message, TOAST_OPTIONS),
  });

  return (
    <Modale
      onOpenChange={(ouverte) => {
        if (!ouverte) onClose();
      }}
      open
      size="sm"
      title="Supprimer la période d'information"
    >
      <p>
        Supprimer la période du {formaterJour(periode.dateDebut)} au{" "}
        {formaterJour(periode.dateFin)} ? Elle restera dans la liste, sans
        pouvoir être modifiée.
      </p>
      <div className="mt-6 flex justify-end gap-4">
        <Button onClick={onClose} variant="secondary">
          Annuler
        </Button>
        <Button
          onClick={() => {
            if (deletePeriode.isPending) return;
            deletePeriode.mutate({
              id: periode.id,
              csrf: récupérerUnCookie("csrf") ?? "",
            });
          }}
          variant="primary"
        >
          Supprimer
        </Button>
      </div>
    </Modale>
  );
};
