import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { validationPropositionValeurAvancement } from "@/validation/proposition-valeur-avancement";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";
import {
  estPropositionCreee,
  estPropositionModifiee,
} from "@/components/_commons/IndicateursChantier/Bloc/utils";

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

const useModalePropositionValeurAvancementV2 = () => {
  const { data: session } = useSession();

  const auteurModification = session?.user.name;

  const { indicateur, detailIndicateurDuTerritoire, territoireCode } =
    useBlocIndicateurContext();

  console.log(indicateur.id);
  console.log(detailIndicateurDuTerritoire);

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

  const mutationModifierPropositonValeurAvancement =
    api.propositionValeurAvancement.modifier.useMutation({
      onSuccess: () => {
        setEtapePropositionValeurAvancement(null);
      },
    });

  const creerPropositonValeurAvancement = async (
    estUneModification: boolean,
    data: PropositionValeurAvancementForm,
  ) => {
    const inputs = {
      csrf: récupérerUnCookie("csrf") ?? "",
      ...data,
      valeurAvancement: data.valeurAvancement,
      dateValeurAvancement: data.dateValeurAvancement!,
      indicId: indicateur.id,
      territoireCode,
    };

    if (estUneModification) {
      mutationModifierPropositonValeurAvancement.mutate({
        ...inputs,
        dateValeurAvancement: "2024-10-01T00:00:00.000Z",
      });
    } else {
      console.log({
        ...inputs,
        dateValeurAvancement: "2024-10-01T00:00:00.000Z",
      });
      mutationCreerPropositonValeurAvancement.mutate({
        ...inputs,
        dateValeurAvancement: "2024-10-01T00:00:00.000Z",
      });
    }
  };

  const estUneModificationDeProposition =
    estPropositionCreee(detailIndicateurDuTerritoire) ||
    estPropositionModifiee(detailIndicateurDuTerritoire);

  const reactHookForm = useForm<PropositionValeurAvancementForm>({
    mode: "all",
    resolver: zodResolver(validationPropositionValeurAvancement),
    defaultValues:
      detailIndicateurDuTerritoire.proposition &&
      estUneModificationDeProposition
        ? {
            valeurAvancement: `${detailIndicateurDuTerritoire.proposition.valeurAvancement}`,
            motifProposition:
              detailIndicateurDuTerritoire.proposition.motif || "",
            sourceDonneeEtMethodeCalcul:
              detailIndicateurDuTerritoire.proposition
                .sourceDonneeEtMethodeCalcul || "",
            dateValeurAvancement:
              detailIndicateurDuTerritoire.dateValeurAvancementMandat!,
            indicId: indicateur.id,
            territoireCode,
          }
        : {
            valeurAvancement: `${detailIndicateurDuTerritoire.valeurAvancementMandat}`,
            motifProposition: "",
            sourceDonneeEtMethodeCalcul: "",
            dateValeurAvancement:
              detailIndicateurDuTerritoire.dateValeurAvancementMandat!,
            indicId: indicateur.id,
            territoireCode,
          },
  });

  reactHookForm.watch("motifProposition");
  reactHookForm.watch("sourceDonneeEtMethodeCalcul");
  reactHookForm.watch("valeurAvancement");

  const EtapeSuivanteEstDesactive =
    Object.keys(reactHookForm.formState.errors).length > 0 ||
    reactHookForm.getValues("motifProposition").length === 0 ||
    reactHookForm.getValues("sourceDonneeEtMethodeCalcul").length === 0 ||
    Number.parseFloat(reactHookForm.getValues("valeurAvancement")) ===
      detailIndicateurDuTerritoire.valeurAvancementMandat;

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
