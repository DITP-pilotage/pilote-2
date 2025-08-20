import { useForm } from "react-hook-form";
import { useState } from "react";
import { useSession } from "next-auth/react";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import type { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";

interface SuppressionPropositionValeurAvancementForm {
  motifSuppression: string;
}

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

const useModaleSuppressionValeurAvancementV2 = ({
  detailIndicateur,
  indicateur,
  territoireCode,
}: {
  indicateur: Indicateur;
  detailIndicateur: DétailsIndicateur;
  territoireCode: string;
}) => {
  const { data: session } = useSession();

  const auteurModification = session?.user.name!;

  const [
    etapePropositionValeurAvancement,
    setEtapePropositionValeurAvancement,
  ] = useState<EtapeSuppressionPropositionValeurAvancement | null>(
    EtapeSuppressionPropositionValeurAvancement.SAISIE_MOTIF_SUPPRESSION_PROPOSITION,
  );

  const mutationSupprimerPropositionValeurAvancement =
    api.propositionValeurAvancement.supprimerV2.useMutation({
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
      auteurModification,
      territoireCode,
      dateValeurAvancement: detailIndicateur.dateValeurAvancementMandat!,
      motif: data.motifSuppression,
    };

    mutationSupprimerPropositionValeurAvancement.mutate(inputs);
  };

  const reactHookForm = useForm<SuppressionPropositionValeurAvancementForm>({
    mode: "all",
    defaultValues: {
      motifSuppression: "",
    },
  });

  const estUneModificationDeProposition = detailIndicateur.proposition !== null;

  reactHookForm.watch("motifSuppression");

  const EtapeSuivanteEstDesactive =
    reactHookForm.getValues("motifSuppression").length === 0;

  return {
    reactHookForm,
    supprimerPropositionValeurAvancement,
    etapePropositionValeurAvancement,
    setEtapePropositionValeurAvancement,
    auteurModification,
    EtapeSuivanteEstDesactive,
    estUneModificationDeProposition,
  };
};

export default useModaleSuppressionValeurAvancementV2;
