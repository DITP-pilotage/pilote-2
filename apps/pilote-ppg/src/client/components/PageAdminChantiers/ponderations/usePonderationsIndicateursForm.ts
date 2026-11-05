import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { api } from "@/server/framework/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { MAILLES, Maille } from "@/server/parametrage-chantier/domain/maille";
import { IndicateurPonderation } from "@/server/parametrage-chantier/queries/GetIndicateursPonderationsChantierQuery";
import {
  CHAMP_POIDS_PAR_MAILLE,
  calculerSommesParMaille,
} from "@/components/PageAdminChantiers/ponderations/sommesPonderations";

export interface LignePonderationForm {
  estActif: boolean;
  poidsPourcentDept: number | null;
  poidsPourcentReg: number | null;
  poidsPourcentNat: number | null;
}

export interface PonderationsForm {
  lignes: LignePonderationForm[];
}

export type FiltreStatut = "tous" | "actifs" | "inactifs";

export type ModificationLigne = "reactive" | "desactive" | "modifie" | null;

const valeursFormulaire = (
  ponderations: IndicateurPonderation[],
): PonderationsForm => ({
  lignes: ponderations.map((ponderation) => ({
    estActif: ponderation.estActif,
    poidsPourcentDept: ponderation.poidsPourcentDept,
    poidsPourcentReg: ponderation.poidsPourcentReg,
    poidsPourcentNat: ponderation.poidsPourcentNat,
  })),
});

function determinerModification(
  ligne: LignePonderationForm,
  ponderation: IndicateurPonderation,
): ModificationLigne {
  if (ligne.estActif !== ponderation.estActif) {
    return ligne.estActif ? "reactive" : "desactive";
  }
  const poidsModifie = MAILLES.some(
    (maille) =>
      ligne[CHAMP_POIDS_PAR_MAILLE[maille]] !==
      ponderation[CHAMP_POIDS_PAR_MAILLE[maille]],
  );
  return poidsModifie ? "modifie" : null;
}

export const filtrerIndicesParStatut = (
  ponderations: IndicateurPonderation[],
  filtre: FiltreStatut,
) =>
  ponderations.flatMap((ponderation, index) =>
    filtre === "tous" || ponderation.estActif === (filtre === "actifs")
      ? [index]
      : [],
  );

export const usePonderationsIndicateursForm = ({
  ponderations,
}: {
  ponderations: IndicateurPonderation[];
}) => {
  const refreshRouter = useRefreshRouter();

  const reactHookForm = useForm<PonderationsForm>({
    defaultValues: valeursFormulaire(ponderations),
  });
  const { reset } = reactHookForm;

  const lignes = useWatch({ control: reactHookForm.control, name: "lignes" });

  const sommesParMaille = useMemo(
    () =>
      calculerSommesParMaille(
        ponderations.map((ponderation, index) => ({
          ...ponderation,
          ...lignes[index],
        })),
      ),
    [lignes, ponderations],
  );

  const sommesEnErreur = useMemo(
    () =>
      Object.fromEntries(
        MAILLES.map((maille) => [
          maille,
          sommesParMaille[maille] !== undefined &&
            sommesParMaille[maille] !== 100,
        ]),
      ) as Record<Maille, boolean>,
    [sommesParMaille],
  );

  const modifications = useMemo(
    () =>
      ponderations.map((ponderation, index) =>
        determinerModification(lignes[index], ponderation),
      ),
    [lignes, ponderations],
  );

  const nombreModifications = modifications.filter(Boolean).length;
  const nombreReactivations = modifications.filter(
    (modification) => modification === "reactive",
  ).length;
  const nombreDesactivations = modifications.filter(
    (modification) => modification === "desactive",
  ).length;

  const mutation =
    api.parametrageChantier.savePonderationsIndicateurs.useMutation({
      onSuccess: () => {
        toast.success("Les pondérations ont bien été enregistrées.", {
          position: "bottom-right",
          richColors: true,
        });
        void refreshRouter();
      },
      onError: (error) =>
        toast.error(error.message, {
          position: "bottom-right",
          richColors: true,
        }),
    });

  const enregistrer = reactHookForm.handleSubmit((data) => {
    mutation.mutate({
      csrf: récupérerUnCookie("csrf") ?? "",
      lignes: data.lignes.map((ligne, index) => ({
        indicId: ponderations[index].indicId,
        estActif: ligne.estActif,
        poidsPourcentDept: ligne.poidsPourcentDept,
        poidsPourcentReg: ligne.poidsPourcentReg,
        poidsPourcentNat: ligne.poidsPourcentNat,
      })),
    });
  });

  return {
    reactHookForm,
    sommesParMaille,
    sommesEnErreur,
    modifications,
    nombreModifications,
    nombreReactivations,
    nombreDesactivations,
    annuler: () => reset(valeursFormulaire(ponderations)),
    enregistrer,
    estEnCoursDEnregistrement: mutation.isPending,
  };
};
