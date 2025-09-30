import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { LIMITE_CARACTERES_DOCUMENTATION_PROPOSITION } from "@/validation/proposition-valeur-avancement";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";
import {
  estPropositionCreee,
  estPropositionModifiee,
} from "@/components/_commons/IndicateursChantier/Bloc/utils";

export enum EtapePropositionValeurAvancement {
  SAISIE_VALEUR_ACTUELLE = "SAISIE_VALEUR_ACTUELLE",
  VALIDATION_VALEUR_ACTUELLE = "VALIDATION_VALEUR_ACTUELLE",
}

const baseFormSchema = z.object({
  valeurAvancement: z
    .string()
    .refine(
      (value) => new RegExp(/^-?\d+$|^-?\d+([,.])\d+$/).test(value),
      "Le champ doit être un nombre",
    ),
  motifProposition: z
    .string()
    .max(
      LIMITE_CARACTERES_DOCUMENTATION_PROPOSITION,
      "La limite maximale de 500 caractères a été dépassée",
    )
    .refine(
      (value) => value && new RegExp(/^\w.*$/).test(value),
      "Veuillez saisir un motif de proposition",
    ),
  moisValeurAvancement: z
    .string()
    .refine(
      (value) => new RegExp(/^(0[1-9]|1[0-2])\/\d{4}$/).test(value),
      "Le champ doit être au format MM/YYYY",
    ),
  sourceDonneeEtMethodeCalcul: z
    .string()
    .max(
      LIMITE_CARACTERES_DOCUMENTATION_PROPOSITION,
      "La limite maximale de 500 caractères a été dépassée",
    ),
  indicId: z.string(),
  territoireCode: z.string(),
});

type PropositionValeurAvancementForm = z.infer<typeof baseFormSchema>;

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

const estMoisAvant = (mois1: string, mois2: string) => {
  const partsMois1 = mois1.split("/");
  const partsMois2 = mois2.split("/");

  return (
    `${partsMois1[1]}-${partsMois1[0]}-01` <=
    `${partsMois2[1]}-${partsMois2[0]}-01`
  );
};

const formatterMois = (date: string) => {
  const annee = new Date(date).getFullYear();
  const mois = new Date(date).getMonth() + 1;
  return `${mois.toString().padStart(2, "0")}/${annee}`;
};

const useModalePropositionValeurAvancementV2 = () => {
  const { data: session } = useSession();

  const auteurModification = session?.user.name;

  const { indicateur, detailIndicateurDuTerritoire, territoireCode } =
    useBlocIndicateurContext();

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
    const [mois, annee] = data.moisValeurAvancement.split("/");
    const inputs = {
      csrf: récupérerUnCookie("csrf") ?? "",
      ...data,
      valeurAvancement: data.valeurAvancement,
      dateValeurAvancement: `${annee}-${mois}-01T00:00:00.000Z`,
      indicId: indicateur.id,
      territoireCode,
    };

    if (estUneModification) {
      mutationModifierPropositonValeurAvancement.mutate(inputs);
    } else {
      mutationCreerPropositonValeurAvancement.mutate(inputs);
    }
  };

  const estUneModificationDeProposition =
    estPropositionCreee(detailIndicateurDuTerritoire) ||
    estPropositionModifiee(detailIndicateurDuTerritoire);

  const moisDateValeurAvancementMandat = formatterMois(
    detailIndicateurDuTerritoire.dateValeurAvancementMandat!,
  );

  const formSchema = useMemo(() => {
    return baseFormSchema.refine(
      (obj) => {
        return estMoisAvant(
          moisDateValeurAvancementMandat,
          obj.moisValeurAvancement,
        );
      },
      {
        path: ["moisValeurAvancement"],
        message:
          "La date de la proposition doit être supérieure à la dernière date de valeur d'avancement",
      },
    );
  }, [moisDateValeurAvancementMandat]);
  const reactHookForm = useForm<PropositionValeurAvancementForm>({
    mode: "all",
    resolver: zodResolver(formSchema),
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
            moisValeurAvancement: formatterMois(
              detailIndicateurDuTerritoire.proposition.dateValeurAvancement,
            ),
            indicId: indicateur.id,
            territoireCode,
          }
        : {
            valeurAvancement: `${detailIndicateurDuTerritoire.valeurAvancementMandat}`,
            motifProposition: "",
            sourceDonneeEtMethodeCalcul: "",
            moisValeurAvancement: moisDateValeurAvancementMandat,
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
