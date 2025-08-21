import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { z } from "zod";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import type { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";

export const LIMIT_CARACTERES_MOTIF = 500;

const formSchema = z
  .object({
    indicId: z.string(),
    territoireCode: z.string(),
    dateValeurAvancement: z.string(),
    motif: z
      .string()
      .trim()
      .max(
        LIMIT_CARACTERES_MOTIF,
        "La limite maximale de 500 caractères a été dépassée",
      ),
    decision: z.enum(["accepter", "accepter-avec-modification", "refuser"]),
    valeurModification: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.decision !== "accepter") {
        return data.motif.length > 0;
      }
      return true;
    },
    {
      message: "Veuillez saisir un motif de refus",
      path: ["motif"],
    },
  )
  .refine(
    (data) => {
      if (data.decision === "accepter-avec-modification") {
        return (
          data.valeurModification && data.valeurModification.trim().length > 0
        );
      }
      return true;
    },
    {
      message: "Veuillez saisir une valeur de modification",
      path: ["valeurModification"],
    },
  )
  .refine(
    (data) => {
      if (
        data.decision === "accepter-avec-modification" &&
        data.valeurModification
      ) {
        return new RegExp(/^-?\d+$|^-?\d+([,.])\d+$/).test(
          data.valeurModification,
        );
      }
      return true;
    },
    {
      message: "La valeur doit être un nombre",
      path: ["valeurModification"],
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

  const mutationAccepterAvecModificationPropositonValeurAvancement =
    api.propositionValeurAvancement.accepterAvecModification.useMutation({
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
    } else if (data.decision === "accepter-avec-modification") {
      const valeurModification = Number.parseFloat(
        data.valeurModification?.replace(",", ".") || "0",
      );
      mutationAccepterAvecModificationPropositonValeurAvancement.mutate({
        ...inputs,
        valeur: valeurModification,
      });
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
      valeurModification:
        detailIndicateur.proposition?.valeurAvancement.toString(),
    },
  });

  const etapeSuivanteEstDesactive = !reactHookForm.formState.isValid;

  return {
    reactHookForm,
    traiterDecision,
    etapePropositionValeurAvancement,
    setEtapePropositionValeurAvancement,
    etapeSuivanteEstDesactive,
  };
};
