import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { z } from "zod";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import type { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { validationAccuserReceptionPropostionValeurAvancement } from "@/validation/proposition-valeur-avancement";

type FormData = z.infer<
  typeof validationAccuserReceptionPropostionValeurAvancement
>;

export enum EtapeAccuserReception {
  EXAMEN_PROPOSITION = "EXAMEN_PROPOSITION",
  VALIDATION_ACCUSE_RECEPTION = "VALIDATION_ACCUSE_RECEPTION",
}

export const Stepper: Record<
  EtapeAccuserReception[keyof EtapeAccuserReception & number],
  {
    numeroEtape: number;
    titre: string;
    etapeSuivante: string | null;
  }
> = {
  [EtapeAccuserReception.EXAMEN_PROPOSITION]: {
    numeroEtape: 1,
    titre: "Examen de la proposition",
    etapeSuivante: "Validation du passage en instruction",
  },
  [EtapeAccuserReception.VALIDATION_ACCUSE_RECEPTION]: {
    numeroEtape: 2,
    titre: "Validation de l'accusé de réception",
    etapeSuivante: null,
  },
};

export const useModaleAccuserReceptionPropositionValeurAvancement = ({
  detailIndicateur,
  indicateur,
  territoireCode,
}: {
  indicateur: Indicateur;
  detailIndicateur: DétailsIndicateur;
  territoireCode: string;
}) => {
  const [etapeAccuserReception, setEtapeAccuserReception] =
    useState<EtapeAccuserReception | null>(
      EtapeAccuserReception.EXAMEN_PROPOSITION,
    );

  const mutationAccuserReceptionPropositionValeurAvancement =
    api.propositionValeurAvancement.accuserReception.useMutation({
      onSuccess: () => {
        setEtapeAccuserReception(null);
      },
    });

  const traiterAccuseReception: SubmitHandler<FormData> = async (data) => {
    const inputs = {
      csrf: récupérerUnCookie("csrf") ?? "",
      motif: data.motif,
      dateValeurAvancement: data.dateValeurAvancement,
      indicId: indicateur.id,
      territoireCode,
    };

    mutationAccuserReceptionPropositionValeurAvancement.mutate({
      ...inputs,
      dateValeurAvancement: "2024-10-01T00:00:00.000Z",
    });
  };

  const reactHookForm = useForm<FormData>({
    mode: "all",
    resolver: zodResolver(validationAccuserReceptionPropostionValeurAvancement),
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
    traiterAccuseReception,
    etapeAccuserReception,
    setEtapeAccuserReception,
    etapeSuivanteEstDesactive,
  };
};
