import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { z } from "zod";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import type { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";

// Form schema that includes decision with conditional motif validation
const formSchema = z
  .object({
    indicId: z.string(),
    territoireCode: z.string(),
    dateValeurAvancement: z.string(),
    motif: z.string().trim(),
    decision: z.enum(["accepter", "accepter-avec-modification", "refuser"]),
  })
  .refine(
    (data) => {
      // If decision is "refuser", motif is required
      if (data.decision === "refuser") {
        return data.motif.length > 0;
      }
      return true;
    },
    {
      message: "Veuillez saisir un motif de refus",
      path: ["motif"],
    },
  );

type FormData = z.infer<typeof formSchema>;

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

  const traiterDecision: SubmitHandler<FormData> = async (data) => {
    const inputs = {
      csrf: récupérerUnCookie("csrf") ?? "",
      motif: data.motif,
      dateValeurAvancement: data.dateValeurAvancement,
      indicId: indicateur.id,
      territoireCode,
    };

    if (data.decision === "refuser") {
      mutationRefuserPropositonValeurAvancement.mutate(inputs);
    } else {
      mutationAccepterPropositonValeurAvancement.mutate(inputs);
    }
  };

  const reactHookForm = useForm<FormData>({
    mode: "all",
    resolver: zodResolver(formSchema),
    defaultValues: {
      motif: "",
      dateValeurAvancement: detailIndicateur.dateValeurAvancementMandat!,
      indicId: indicateur.id,
      territoireCode,
      decision: "accepter",
    },
  });

  const etapeSuivanteEstDesactive = !reactHookForm.formState.isValid;

  return {
    reactHookForm,
    traiterDecision,
    etapePropositionValeurAvancement,
    setEtapePropositionValeurAvancement,
    auteurModification,
    etapeSuivanteEstDesactive,
  };
};
