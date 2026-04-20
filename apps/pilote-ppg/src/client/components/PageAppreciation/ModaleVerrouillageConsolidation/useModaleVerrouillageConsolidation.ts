import { useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import api from "@/server/infrastructure/api/trpc/api";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { FicheEvaluation } from "@/server/evaluation/domain/FicheEvaluation";

export enum EtapeTransmission {
  SELECTION_TERRITOIRES = "SELECTION_TERRITOIRES",
  VALIDATION = "VALIDATION",
}

export const Stepper = {
  [EtapeTransmission.SELECTION_TERRITOIRES]: {
    numeroEtape: 1,
    titre: "Sélection des appréciations à transmettre",
    etapeSuivante: "Récapitulatif et validation",
  },
  [EtapeTransmission.VALIDATION]: {
    numeroEtape: 2,
    titre: "Récapitulatif et validation",
    etapeSuivante: null,
  },
};

type FormData = {
  territoiresSelectionnes: Record<string, boolean>;
};

export const useTransmissionDITP = (fichesConsolidation: FicheEvaluation[]) => {
  const [etapeTransmission, setEtapeTransmission] =
    useState<EtapeTransmission | null>(EtapeTransmission.SELECTION_TERRITOIRES);

  const mutation = api.evaluation.transmettreAppreciation.useMutation();
  const refreshRouter = useRefreshRouter();

  const fichesSelectionnables = fichesConsolidation.filter(
    (fiche) => !fiche.readOnly,
  );

  const reactHookForm = useForm<FormData>({
    defaultValues: {
      territoiresSelectionnes: fichesSelectionnables.reduce(
        (acc, fiche) => ({ ...acc, [fiche.id]: false }),
        {},
      ),
    },
  });

  const territoiresSelectionnes = reactHookForm.watch(
    "territoiresSelectionnes",
  );
  const fichesSelectionnees = Object.entries(territoiresSelectionnes)
    .filter(([, isSelected]) => isSelected)
    .map(([ficheId]) => ficheId);

  const tousSelectionnes =
    fichesSelectionnables.length > 0 &&
    fichesSelectionnables.every((fiche) => territoiresSelectionnes[fiche.id]);

  const toggleTout = () => {
    const nouvelleValeur = !tousSelectionnes;
    fichesSelectionnables.forEach((fiche) => {
      reactHookForm.setValue(
        `territoiresSelectionnes.${fiche.id}`,
        nouvelleValeur,
      );
    });
  };

  const verrouillerLaConsolidation = async () => {
    await mutation.mutateAsync(
      { ficheEvaluationIds: fichesSelectionnees },
      {
        onSuccess: async () => {
          toast.success(
            "Les territoires ont été transmis à la DITP avec succès",
            {
              position: "top-right",
              richColors: true,
            },
          );
          setEtapeTransmission(null);
          await refreshRouter();
        },
      },
    );
  };

  return {
    reactHookForm,
    etapeTransmission,
    setEtapeTransmission,
    fichesSelectionnables,
    fichesSelectionnees,
    tousSelectionnes,
    toggleTout,
    verrouillerLaConsolidation,
    fichesConsolidation,
    reset: () => {
      setEtapeTransmission(EtapeTransmission.SELECTION_TERRITOIRES);
      reactHookForm.reset();
    },
  };
};
