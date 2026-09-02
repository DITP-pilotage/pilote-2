import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import AlerteProps from "@/components/_commons/Alerte/Alerte.interface";
import { MAILLES, Maille } from "@/server/metadataChantier/domain/maille";
import { IndicateurPonderation } from "@/server/metadataChantier/queries/RecupererIndicateursPonderationsChantierQuery";

export interface LignePonderationForm {
  poidsPourcentDept: number | null;
  poidsPourcentReg: number | null;
  poidsPourcentNat: number | null;
}

interface PonderationsForm {
  lignes: LignePonderationForm[];
}

export const CHAMP_POIDS_PAR_MAILLE: Record<
  Maille,
  "poidsPourcentDept" | "poidsPourcentReg" | "poidsPourcentNat"
> = {
  NAT: "poidsPourcentNat",
  REG: "poidsPourcentReg",
  DEPT: "poidsPourcentDept",
};

function calculerSommesParMaille(
  lignes: LignePonderationForm[],
  ponderations: IndicateurPonderation[],
): Partial<Record<Maille, number>> {
  const sommes: Partial<Record<Maille, number>> = {};
  for (const maille of MAILLES) {
    const indicesConcernés = ponderations.reduce<number[]>(
      (indices, ponderation, index) =>
        ponderation.maillesApplicables.includes(maille)
          ? [...indices, index]
          : indices,
      [],
    );
    if (indicesConcernés.length === 0) continue;
    sommes[maille] = indicesConcernés.reduce(
      (total, index) =>
        total + (lignes[index]?.[CHAMP_POIDS_PAR_MAILLE[maille]] ?? 0),
      0,
    );
  }
  return sommes;
}

function calculerErreursSommes(
  sommesParMaille: Partial<Record<Maille, number>>,
): Partial<Record<Maille, string>> {
  const erreurs: Partial<Record<Maille, string>> = {};
  for (const maille of MAILLES) {
    const somme = sommesParMaille[maille];
    if (somme !== undefined && somme !== 100) {
      erreurs[maille] =
        `La somme doit être égale à 100 (actuellement ${somme}).`;
    }
  }
  return erreurs;
}

export const usePonderationsIndicateursForm = ({
  ponderations,
}: {
  chantierId: string;
  ponderations: IndicateurPonderation[];
}) => {
  const [alerte, setAlerte] = useState<AlerteProps | null>(null);
  const refreshRouter = useRefreshRouter();

  const reactHookForm = useForm<PonderationsForm>({
    defaultValues: {
      lignes: ponderations.map((ponderation) => ({
        poidsPourcentDept: ponderation.poidsPourcentDept,
        poidsPourcentReg: ponderation.poidsPourcentReg,
        poidsPourcentNat: ponderation.poidsPourcentNat,
      })),
    },
  });

  const lignes = useWatch({ control: reactHookForm.control, name: "lignes" });
  const sommesParMaille = useMemo(
    () => calculerSommesParMaille(lignes, ponderations),
    [lignes, ponderations],
  );
  const erreursSommes = useMemo(
    () => calculerErreursSommes(sommesParMaille),
    [sommesParMaille],
  );

  const mutation =
    api.metadataChantier.enregistrerPonderationsIndicateurs.useMutation({
      onSuccess: () => {
        setAlerte({
          type: "succès",
          titre: "Les pondérations ont bien été enregistrées.",
        });
        refreshRouter();
      },
      onError: (error) => setAlerte({ type: "erreur", titre: error.message }),
    });

  const enregistrer = reactHookForm.handleSubmit((data) => {
    if (Object.keys(erreursSommes).length > 0) return;
    mutation.mutate({
      csrf: récupérerUnCookie("csrf") ?? "",
      lignes: data.lignes.map((ligne, index) => ({
        indicId: ponderations[index].indicId,
        poidsPourcentDept: ligne.poidsPourcentDept,
        poidsPourcentReg: ligne.poidsPourcentReg,
        poidsPourcentNat: ligne.poidsPourcentNat,
      })),
    });
  });

  return {
    reactHookForm,
    sommesParMaille,
    erreursSommes,
    enregistrer,
    alerte,
    estEnCoursDEnregistrement: mutation.isPending,
  };
};
