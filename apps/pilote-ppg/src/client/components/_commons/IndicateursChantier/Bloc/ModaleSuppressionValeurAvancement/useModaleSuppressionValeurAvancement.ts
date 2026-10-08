import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Indicateur } from "@/shared/indicateur/Indicateur.interface";
import type { DétailsIndicateur } from "@/shared/indicateur/DetailsIndicateur.interface";
import { api } from "@/server/framework/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { validationSuppressionPropositionValeurAvancement } from "@/validation/proposition-valeur-avancement";

type SuppressionPropositionValeurAvancementForm = z.infer<
  typeof validationSuppressionPropositionValeurAvancement
>;

export enum EtapeSuppressionPropositionValeurAvancement {
  SAISIE_MOTIF_SUPPRESSION_PROPOSITION = "SAISIE_MOTIF_SUPPRESSION_PROPOSITION",
  VALIDATION_SUPPRESSION_PROPOSITION = "VALIDATION_SUPPRESSION_PROPOSITION",
}

export const Stepper: Record<
  EtapeSuppressionPropositionValeurAvancement[keyof EtapeSuppressionPropositionValeurAvancement &
    number],
  {
    numeroEtape: number;
    titre: string;
    etapeSuivante: string | null;
  }
> = {
  [EtapeSuppressionPropositionValeurAvancement.SAISIE_MOTIF_SUPPRESSION_PROPOSITION]:
    {
      numeroEtape: 1,
      titre: "Saisie du motif de suppression",
      etapeSuivante: "Confirmation de la suppression",
    },
  [EtapeSuppressionPropositionValeurAvancement.VALIDATION_SUPPRESSION_PROPOSITION]:
    {
      numeroEtape: 2,
      titre: "Confirmation de la suppression",
      etapeSuivante: null,
    },
};

const useModaleSuppressionValeurAvancement = ({
  detailIndicateur,
  indicateur,
  territoireCode,
}: {
  indicateur: Indicateur;
  detailIndicateur: DétailsIndicateur;
  territoireCode: string;
}) => {
  const [
    etapePropositionValeurAvancement,
    setEtapePropositionValeurAvancement,
  ] = useState<EtapeSuppressionPropositionValeurAvancement | null>(
    EtapeSuppressionPropositionValeurAvancement.SAISIE_MOTIF_SUPPRESSION_PROPOSITION,
  );

  const mutationSupprimerPropositionValeurAvancement =
    api.propositionValeurAvancement.supprimer.useMutation({
      onSuccess: () => {
        setEtapePropositionValeurAvancement(null);
      },
    });

  const supprimerPropositionValeurAvancement = async (
    data: SuppressionPropositionValeurAvancementForm,
  ) => {
    const inputs = {
      csrf: récupérerUnCookie("csrf") ?? "",
      indicId: indicateur.id,
      territoireCode,
      dateValeurAvancement: detailIndicateur.proposition!.dateValeurAvancement,
      motif: data.motifSuppression,
    };

    mutationSupprimerPropositionValeurAvancement.mutate(inputs);
  };
  const reactHookForm = useForm<SuppressionPropositionValeurAvancementForm>({
    mode: "all",
    resolver: zodResolver(validationSuppressionPropositionValeurAvancement),
    defaultValues: {
      motifSuppression: "",
    },
  });

  return {
    reactHookForm,
    supprimerPropositionValeurAvancement,
    etapePropositionValeurAvancement,
    setEtapePropositionValeurAvancement,
    etapeSuivanteEstDesactive: !reactHookForm.formState.isValid,
    isPending: mutationSupprimerPropositionValeurAvancement.isPending,
  };
};

export default useModaleSuppressionValeurAvancement;
