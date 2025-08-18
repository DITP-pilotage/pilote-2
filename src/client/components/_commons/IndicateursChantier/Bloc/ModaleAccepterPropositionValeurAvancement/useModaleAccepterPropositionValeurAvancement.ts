import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useSession } from "next-auth/react";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import type { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import {
  validationAccepterPropositionValeurAvancement,
  validationPropositionValeurAvancement,
} from "@/validation/proposition-valeur-avancement";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";

interface PropositionValeurAvancementForm {
  motifProposition: string;
  dateValeurAvancement: string;
  indicId: string;
  territoireCode: string;
}

export enum EtapePropositionValeurAvancement {
  DECISION_CONCERNANT_LA_PROPOSITION = "DECISION_CONCERNANT_LA_PROPOSITION",
  VALIDATION_DECISION = "VALIDATION_DECISION",
}

export const Stepper: Record<
  EtapePropositionValeurAvancement[keyof EtapePropositionValeurAvancement &
    number],
  {
    numeroEtape: number;
    titre: string;
    etapeSuivante: string | null;
  }
> = {
  [EtapePropositionValeurAvancement.DECISION_CONCERNANT_LA_PROPOSITION]: {
    numeroEtape: 1,
    titre: "Décision concernant la proposition",
    etapeSuivante: "Validation de la décision",
  },
  [EtapePropositionValeurAvancement.VALIDATION_DECISION]: {
    numeroEtape: 2,
    titre: "Validation de la décision",
    etapeSuivante: null,
  },
};

export const useModaleAccepterPropositionValeurAvancement = ({
  detailIndicateur,
  indicateur,
  territoireCode,
}: {
  indicateur: Indicateur;
  detailIndicateur: DétailsIndicateur;
  territoireCode: string;
}) => {
  const { data: session } = useSession();

  const auteurModification = session?.user.name;

  const [
    etapePropositionValeurAvancement,
    setEtapePropositionValeurAvancement,
  ] = useState<EtapePropositionValeurAvancement | null>(
    EtapePropositionValeurAvancement.DECISION_CONCERNANT_LA_PROPOSITION,
  );

  const mutationCreerPropositonValeurAvancement =
    api.propositionValeurAvancement.accepter.useMutation({
      onSuccess: () => {
        setEtapePropositionValeurAvancement(null);
      },
    });

  const accepterPropositonValeurAvancement: SubmitHandler<
    PropositionValeurAvancementForm
  > = async (data) => {
    const inputs = {
      csrf: récupérerUnCookie("csrf") ?? "",
      motif: data.motifProposition,
      dateValeurAvancement: data.dateValeurAvancement,
      indicId: indicateur.id,
      territoireCode,
    };

    mutationCreerPropositonValeurAvancement.mutate(inputs);
  };

  const reactHookForm = useForm<PropositionValeurAvancementForm>({
    mode: "all",
    resolver: zodResolver(validationAccepterPropositionValeurAvancement),
    defaultValues: {
      motifProposition: "",
      dateValeurAvancement: detailIndicateur.dateValeurAvancementMandat!,
      indicId: indicateur.id,
      territoireCode,
    },
  });

  const etapeSuivanteEstDesactive = false;

  return {
    reactHookForm,
    accepterPropositonValeurAvancement,
    etapePropositionValeurAvancement,
    setEtapePropositionValeurAvancement,
    auteurModification,
    etapeSuivanteEstDesactive,
  };
};
