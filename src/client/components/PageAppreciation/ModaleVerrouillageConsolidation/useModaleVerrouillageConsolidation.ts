import { useState } from "react";
import { toast } from "sonner";
import api from "@/server/infrastructure/api/trpc/api";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { FicheEvaluation } from "@/server/evaluation/domain/FicheEvaluation";

export const useTransmissionDITP = (fichesConsolidation: FicheEvaluation[]) => {
  const [fichesSelectionnees, setFichesSelectionnees] = useState<Set<string>>(
    new Set(),
  );
  const mutation = api.evaluation.modifierEtatFichesConsolidation.useMutation();
  const refreshRouter = useRefreshRouter();

  const fichesSelectionnables = fichesConsolidation.filter(
    (fiche) => !fiche.readOnly,
  );

  const tousSelectionnes =
    fichesSelectionnables.length > 0 &&
    fichesSelectionnables.every((fiche) => fichesSelectionnees.has(fiche.id));

  const toggleFiche = (ficheId: string) => {
    const nouvellesSelectionnees = new Set(fichesSelectionnees);
    if (nouvellesSelectionnees.has(ficheId)) {
      nouvellesSelectionnees.delete(ficheId);
    } else {
      nouvellesSelectionnees.add(ficheId);
    }
    setFichesSelectionnees(nouvellesSelectionnees);
  };

  const toggleTout = () => {
    if (tousSelectionnes) {
      setFichesSelectionnees(new Set());
    } else {
      setFichesSelectionnees(
        new Set(fichesSelectionnables.map((fiche) => fiche.id)),
      );
    }
  };

  const verrouillerLaConsolidation = async () => {
    await mutation.mutateAsync(
      {
        ficheEvaluationIds: Array.from(fichesSelectionnees),
        readOnly: true,
      },
      {
        onSuccess: async () => {
          toast.success(
            "Les territoires ont été transmis à la DITP avec succès",
            {
              position: "top-right",
              richColors: true,
            },
          );
          setFichesSelectionnees(new Set());
          await refreshRouter();
        },
      },
    );
  };

  return {
    fichesSelectionnees,
    fichesSelectionnables,
    tousSelectionnes,
    toggleFiche,
    toggleTout,
    verrouillerLaConsolidation,
  };
};
