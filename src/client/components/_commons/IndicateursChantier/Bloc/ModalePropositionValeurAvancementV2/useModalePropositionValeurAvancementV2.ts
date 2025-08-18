import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useSession } from "next-auth/react";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import type { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import { validationPropositionValeurAvancement } from "@/validation/proposition-valeur-avancement";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";

interface PropositionValeurAvancementForm {
  valeurAvancement: string;
  motifProposition: string;
  sourceDonneeEtMethodeCalcul: string;
  dateValeurAvancement: string;
  indicId: string;
  territoireCode: string;
}

export enum EtapePropositionValeurAvancement {
  SAISIE_VALEUR_ACTUELLE = "SAISIE_VALEUR_ACTUELLE",
  VALIDATION_VALEUR_ACTUELLE = "VALIDATION_VALEUR_ACTUELLE",
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
  [EtapePropositionValeurAvancement.SAISIE_VALEUR_ACTUELLE]: {
    numeroEtape: 1,
    titre: "Saisie de la proposition",
    etapeSuivante: "Validation de la proposition",
  },
  [EtapePropositionValeurAvancement.VALIDATION_VALEUR_ACTUELLE]: {
    numeroEtape: 2,
    titre: "Validation de la proposition",
    etapeSuivante: null,
  },
};

const useModalePropositionValeurAvancementV2 = ({
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
    EtapePropositionValeurAvancement.SAISIE_VALEUR_ACTUELLE,
  );

  const mutationCreerPropositonValeurAvancement =
    api.propositionValeurAvancement.creerV2.useMutation({
      onSuccess: async () => {
        // TODO(PVA/CHAN/2025-08-18): rafraichir les données de la page
        // await router.replace(router.asPath);
        setEtapePropositionValeurAvancement(null);
      },
    });

  const creerPropositonValeurAvancement: SubmitHandler<
    PropositionValeurAvancementForm
  > = async (data) => {
    const inputs = {
      csrf: récupérerUnCookie("csrf") ?? "",
      ...data,
      valeurAvancement: data.valeurAvancement,
      dateValeurAvancement: data.dateValeurAvancement!,
      indicId: indicateur.id,
      territoireCode,
    };

    mutationCreerPropositonValeurAvancement.mutate(inputs);
  };

  const reactHookForm = useForm<PropositionValeurAvancementForm>({
    mode: "all",
    resolver: zodResolver(validationPropositionValeurAvancement),
    defaultValues:
      detailIndicateur.proposition === null
        ? {
            valeurAvancement: `${detailIndicateur.valeurAvancementMandat}`,
            motifProposition: "",
            sourceDonneeEtMethodeCalcul: "",
            dateValeurAvancement: detailIndicateur.dateValeurAvancementMandat!,
            indicId: indicateur.id,
            territoireCode,
          }
        : {
            valeurAvancement: `${detailIndicateur.proposition.valeurAvancement}`,
            motifProposition: detailIndicateur.proposition.motif || "",
            sourceDonneeEtMethodeCalcul:
              detailIndicateur.proposition.sourceDonneeEtMethodeCalcul || "",
            dateValeurAvancement: detailIndicateur.dateValeurAvancementMandat!,
            indicId: indicateur.id,
            territoireCode,
          },
  });

  const estUneModificationDeProposition = detailIndicateur.proposition !== null;

  reactHookForm.watch("motifProposition");
  reactHookForm.watch("sourceDonneeEtMethodeCalcul");
  reactHookForm.watch("valeurAvancement");

  const EtapeSuivanteEstDesactive =
    Object.keys(reactHookForm.formState.errors).length > 0 ||
    reactHookForm.getValues("motifProposition").length === 0 ||
    reactHookForm.getValues("sourceDonneeEtMethodeCalcul").length === 0 ||
    Number.parseFloat(reactHookForm.getValues("valeurAvancement")) ===
      detailIndicateur.valeurAvancementMandat;

  return {
    reactHookForm,
    creerPropositonValeurAvancement,
    etapePropositionValeurAvancement,
    setEtapePropositionValeurAvancement,
    auteurModification,
    EtapeSuivanteEstDesactive,
    estUneModificationDeProposition,
  };
};

export default useModalePropositionValeurAvancementV2;
