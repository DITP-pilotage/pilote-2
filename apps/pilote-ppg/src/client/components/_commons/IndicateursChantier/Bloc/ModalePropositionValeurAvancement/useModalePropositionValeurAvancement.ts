import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { z } from "zod";
import { champsPropositionValeurAvancement } from "@/validation/proposition-valeur-avancement";
import { api } from "@/server/framework/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";
import {
  estPropositionCreee,
  estPropositionModifiee,
  estUnePropositionTerminée,
} from "@/components/_commons/IndicateursChantier/Bloc/utils";
import { type SelectFieldOption } from "@/components/shared/SelectField";

export enum EtapePropositionValeurAvancement {
  SAISIE_VALEUR_ACTUELLE = "SAISIE_VALEUR_ACTUELLE",
  VALIDATION_VALEUR_ACTUELLE = "VALIDATION_VALEUR_ACTUELLE",
}

export const estChampMoisValide = (value: string) =>
  new RegExp(/^(0?[1-9]|1[0-2])\/\d{4}$/).test(value);

const baseFormSchema = champsPropositionValeurAvancement.extend({
  moisValeurAvancement: z
    .string()
    .refine(
      (value) => estChampMoisValide(value),
      "Le champ doit être au format MM/YYYY",
    )
    .refine((value) => {
      const [mois, annee] = value.split("/").map(Number);
      const date = new Date(annee, mois - 1);
      const now = new Date();
      return date <= now;
    }, "La date de la proposition doit être antérieure ou égale à la date du jour"),
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

const genererOptionsMois = (
  dateDebut: string,
  periodicite: string | null,
): SelectFieldOption<string>[] => {
  const options: SelectFieldOption<string>[] = [];
  const maintenant = new Date();

  const incrementMois =
    periodicite === "Semestrielle"
      ? 6
      : periodicite === "Trimestrielle"
        ? 3
        : periodicite === "Annuelle"
          ? 12
          : 1;

  const dateActuelle = new Date(dateDebut);

  while (dateActuelle <= maintenant) {
    const mois = (dateActuelle.getMonth() + 1).toString().padStart(2, "0");
    const annee = dateActuelle.getFullYear();
    const valeur = `${mois}/${annee}`;

    options.push({
      libelle: valeur,
      valeur,
    });

    dateActuelle.setMonth(dateActuelle.getMonth() + incrementMois);
  }

  return options;
};

const useModalePropositionValeurAvancement = () => {
  const { indicateur, detailIndicateurDuTerritoire, territoireCode } =
    useBlocIndicateurContext();

  const [
    etapePropositionValeurAvancement,
    setEtapePropositionValeurAvancement,
  ] = useState<EtapePropositionValeurAvancement | null>(
    EtapePropositionValeurAvancement.SAISIE_VALEUR_ACTUELLE,
  );

  const mutationCreerPropositonValeurAvancement =
    api.propositionValeurAvancement.creer.useMutation({
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
    (estPropositionCreee(detailIndicateurDuTerritoire) ||
      estPropositionModifiee(detailIndicateurDuTerritoire)) &&
    !estUnePropositionTerminée(detailIndicateurDuTerritoire);

  const moisDateValeurAvancementMandat = formatterMois(
    detailIndicateurDuTerritoire.dateValeurAvancementMandat!,
  );

  const valeurAvancementMandat =
    detailIndicateurDuTerritoire.valeurAvancementMandat;

  const formSchema = useMemo(() => {
    return baseFormSchema
      .refine(
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
      )
      .refine(
        (obj) =>
          obj.moisValeurAvancement !== moisDateValeurAvancementMandat ||
          Number(obj.valeurAvancement.replace(",", ".")) !==
            valeurAvancementMandat,
        {
          path: ["valeurAvancement"],
          message:
            "La valeur proposée doit être différente de la valeur actuelle pour ce mois",
        },
      );
  }, [moisDateValeurAvancementMandat, valeurAvancementMandat]);

  const defaultValues: PropositionValeurAvancementForm =
    detailIndicateurDuTerritoire.proposition && estUneModificationDeProposition
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
          valeurAvancement: `${valeurAvancementMandat}`,
          motifProposition: "",
          sourceDonneeEtMethodeCalcul: "",
          moisValeurAvancement: moisDateValeurAvancementMandat,
          indicId: indicateur.id,
          territoireCode,
        };

  const reactHookForm = useForm<PropositionValeurAvancementForm>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const reinitialiser = () => {
    reactHookForm.reset(defaultValues);
    setEtapePropositionValeurAvancement(
      EtapePropositionValeurAvancement.SAISIE_VALEUR_ACTUELLE,
    );
  };

  const passerALaValidation = reactHookForm.handleSubmit(() =>
    setEtapePropositionValeurAvancement(
      EtapePropositionValeurAvancement.VALIDATION_VALEUR_ACTUELLE,
    ),
  );

  // La règle « valeur différente pour ce mois » porte sur les deux champs :
  // après une première validation, changer de mois revalide aussi la valeur.
  const choisirMois = (mois: string) => {
    reactHookForm.setValue("moisValeurAvancement", mois);
    if (reactHookForm.formState.isSubmitted) {
      void reactHookForm.trigger(["moisValeurAvancement", "valeurAvancement"]);
    }
  };

  const optionsMois = useMemo(
    () =>
      genererOptionsMois(
        detailIndicateurDuTerritoire.dateValeurAvancementMandat!,
        indicateur.periodicite,
      ),
    [
      detailIndicateurDuTerritoire.dateValeurAvancementMandat,
      indicateur.periodicite,
    ],
  );

  const isPending =
    mutationCreerPropositonValeurAvancement.isPending ||
    mutationModifierPropositonValeurAvancement.isPending;

  return {
    reactHookForm,
    creerPropositonValeurAvancement,
    etapePropositionValeurAvancement,
    setEtapePropositionValeurAvancement,
    reinitialiser,
    passerALaValidation,
    choisirMois,
    estUneModificationDeProposition,
    optionsMois,
    isPending,
  };
};

export default useModalePropositionValeurAvancement;
