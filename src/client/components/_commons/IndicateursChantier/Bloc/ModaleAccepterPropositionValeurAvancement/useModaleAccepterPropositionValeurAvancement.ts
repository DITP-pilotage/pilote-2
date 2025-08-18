import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { z } from "zod";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import type { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import { validationAccepterPropositionValeurAvancement } from "@/validation/proposition-valeur-avancement";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";

type PropositionValeurAvancementForm = z.infer<
  typeof validationAccepterPropositionValeurAvancement
>;

type RefuserPropositionValeurAvancementForm = z.infer<
  typeof validationRefuserPropositionValeurAvancement
>;

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
  decision,
}: {
  indicateur: Indicateur;
  detailIndicateur: DétailsIndicateur;
  territoireCode: string;
  decision: "accepter" | "accepter-avec-modification" | "refuser";
}) => {
  const { data: session } = useSession();

  const auteurModification = session?.user.name;

  const [
    etapePropositionValeurAvancement,
    setEtapePropositionValeurAvancement,
  ] = useState<EtapePropositionValeurAvancement | null>(
    EtapePropositionValeurAvancement.DECISION_CONCERNANT_LA_PROPOSITION,
  );

  const mutationAccepterPropositonValeurAvancement =
    api.propositionValeurAvancement.accepter.useMutation({
      onSuccess: () => {
        setEtapePropositionValeurAvancement(null);
      },
    });

  const mutationRefuserPropositonValeurAvancement =
    api.propositionValeurAvancement.refuser.useMutation({
      onSuccess: () => {
        setEtapePropositionValeurAvancement(null);
      },
    });

  const accepterPropositonValeurAvancement: SubmitHandler<
    PropositionValeurAvancementForm
  > = async (data) => {
    const inputs = {
      csrf: récupérerUnCookie("csrf") ?? "",
      motif: data.motif,
      dateValeurAvancement: data.dateValeurAvancement,
      indicId: indicateur.id,
      territoireCode,
    };

    mutationAccepterPropositonValeurAvancement.mutate(inputs);
  };

  const refuserPropositonValeurAvancement: SubmitHandler<
    RefuserPropositionValeurAvancementForm
  > = async (data) => {
    const inputs = {
      csrf: récupérerUnCookie("csrf") ?? "",
      motif: data.motif,
      dateValeurAvancement: data.dateValeurAvancement,
      indicId: indicateur.id,
      territoireCode,
    };

    mutationRefuserPropositonValeurAvancement.mutate(inputs);
  };

  const traiterDecision: SubmitHandler<
    PropositionValeurAvancementForm | RefuserPropositionValeurAvancementForm
  > = async (data) => {
    if (decision === "refuser") {
      refuserPropositonValeurAvancement(
        data as RefuserPropositionValeurAvancementForm,
      );
    } else {
      accepterPropositonValeurAvancement(
        data as PropositionValeurAvancementForm,
      );
    }
  };

  const reactHookForm = useForm({
    mode: "all",
    resolver: zodResolver(
      decision === "refuser"
        ? validationRefuserPropositionValeurAvancement
        : validationAccepterPropositionValeurAvancement,
    ),
    defaultValues: {
      motif: "",
      dateValeurAvancement: detailIndicateur.dateValeurAvancementMandat!,
      indicId: indicateur.id,
      territoireCode,
    },
  });

  const etapeSuivanteEstDesactive = !reactHookForm.formState.isValid;

  return {
    reactHookForm,
    accepterPropositonValeurAvancement,
    refuserPropositonValeurAvancement,
    traiterDecision,
    etapePropositionValeurAvancement,
    setEtapePropositionValeurAvancement,
    auteurModification,
    etapeSuivanteEstDesactive,
  };
};
