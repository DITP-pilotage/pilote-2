import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import AlerteProps from "@/components/_commons/Alerte/Alerte.interface";
import { MAILLES, Maille } from "@/server/metadataChantier/domain/maille";

export interface LignePonderationForm {
  indicId: string;
  indicNom: string;
  maillesApplicables: Maille[];
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
): Partial<Record<Maille, number>> {
  const sommes: Partial<Record<Maille, number>> = {};
  for (const maille of MAILLES) {
    const lignesConcernées = lignes.filter((ligne) =>
      ligne.maillesApplicables.includes(maille),
    );
    if (lignesConcernées.length === 0) continue;
    sommes[maille] = lignesConcernées.reduce(
      (total, ligne) => total + (ligne[CHAMP_POIDS_PAR_MAILLE[maille]] ?? 0),
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
    if (somme !== undefined && Math.abs(somme - 100) > 0) {
      erreurs[maille] =
        `La somme doit être égale à 100 (actuellement ${somme}).`;
    }
  }
  return erreurs;
}

export const usePonderationsIndicateursForm = ({
  chantierId,
}: {
  chantierId: string;
}) => {
  const requête =
    api.metadataChantier.récupérerIndicateursPonderations.useQuery({
      chantierId,
    });
  const [alerte, setAlerte] = useState<AlerteProps | null>(null);
  const [erreursSommes, setErreursSommes] = useState<
    Partial<Record<Maille, string>>
  >({});

  const reactHookForm = useForm<PonderationsForm>({
    defaultValues: { lignes: [] },
  });
  const { fields } = useFieldArray({
    control: reactHookForm.control,
    name: "lignes",
  });

  useEffect(() => {
    if (requête.data) {
      reactHookForm.reset({ lignes: requête.data });
      setErreursSommes({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requête.data]);

  const lignes = reactHookForm.watch("lignes");
  const sommesParMaille = useMemo(
    () => calculerSommesParMaille(lignes),
    [lignes],
  );

  const mutation =
    api.metadataChantier.enregistrerPonderationsIndicateurs.useMutation({
      onSuccess: () => {
        setAlerte({
          type: "succès",
          titre: "Les pondérations ont bien été enregistrées.",
        });
        requête.refetch();
      },
      onError: (error) => setAlerte({ type: "erreur", titre: error.message }),
    });

  const enregistrer = reactHookForm.handleSubmit((data) => {
    const erreurs = calculerErreursSommes(calculerSommesParMaille(data.lignes));
    if (Object.keys(erreurs).length > 0) {
      setErreursSommes(erreurs);
      return;
    }
    setErreursSommes({});
    mutation.mutate({
      csrf: récupérerUnCookie("csrf") ?? "",
      lignes: data.lignes.map((ligne) => ({
        indicId: ligne.indicId,
        poidsPourcentDept: ligne.poidsPourcentDept,
        poidsPourcentReg: ligne.poidsPourcentReg,
        poidsPourcentNat: ligne.poidsPourcentNat,
      })),
    });
  });

  return {
    reactHookForm,
    fields,
    estEnChargement: requête.isLoading,
    sommesParMaille,
    erreursSommes,
    enregistrer,
    alerte,
    estEnCoursDEnregistrement: mutation.isPending,
  };
};
