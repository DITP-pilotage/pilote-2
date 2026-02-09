import { SubmitHandler, useForm } from "react-hook-form";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { MapInformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import { createValidationMetadataIndicateurFormulaire } from "@/validation/metadata-indicateur";
import AlerteProps from "@/components/_commons/Alerte/Alerte.interface";

export type MetadataIndicateurForm = z.infer<
  ReturnType<typeof createValidationMetadataIndicateurFormulaire>
>;

export const usePageIndicateur = (
  indicateur: MetadataParametrageIndicateurContrat,
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat,
) => {
  const router = useRouter();
  const [alerte, setAlerte] = useState<AlerteProps | null>(null);
  const [estEnCoursDeModification, setEstEnCoursDeModification] =
    useState<boolean>(false);

  const validationSchema = useMemo(
    () =>
      createValidationMetadataIndicateurFormulaire(
        mapInformationMetadataIndicateur,
      ),
    [mapInformationMetadataIndicateur],
  );

  const reactHookForm = useForm<MetadataIndicateurForm>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      ...indicateur,
      indicHiddenPilote: indicateur.indicHiddenPilote ? "false" : "true",
      indicIsBaro: indicateur.indicIsBaro,
      indicIsPhare: indicateur.indicIsPhare,
      indicIsPerseverant: indicateur.indicIsPerseverant,
      indicTerritorialise: indicateur.indicTerritorialise,
      donneeOuverte: indicateur.donneeOuverte,
      projetAnnuelPerf: indicateur.projetAnnuelPerf,
      poidsPourcentNat: `${indicateur.poidsPourcentNat}`,
      poidsPourcentReg: `${indicateur.poidsPourcentReg}`,
      poidsPourcentDept: `${indicateur.poidsPourcentDept}`,
      poidsPourcentEvalNat: `${indicateur.poidsPourcentEvalNat}`,
      poidsPourcentEvalReg: `${indicateur.poidsPourcentEvalReg}`,
      poidsPourcentEvalDept: `${indicateur.poidsPourcentEvalDept}`,
      zgApplicable: indicateur.zgApplicable || "",
      delaiDisponibilite: `${indicateur.delaiDisponibilite}`,
      frequenceTerritoriale: `${indicateur.frequenceTerritoriale}`,
      indicParentIndic:
        indicateur.indicParentIndic === null
          ? "Aucun indicateur selectionné"
          : indicateur.indicParentIndic,
      indicParentCh: indicateur.indicParentCh ?? "_",
    },
  });

  const mutationModifierMetadataIndicateur =
    api.metadataIndicateur.modifier.useMutation({
      onSuccess: () => {
        setEstEnCoursDeModification(false);
        router.push(
          `/admin/indicateurs/${indicateur.indicId}?_action=modification-reussie`,
        );
      },
      onError: (error) => {
        setAlerte({
          type: "erreur",
          titre: error.message,
        });
      },
    });
  const mutationCreerMetadataIndicateur =
    api.metadataIndicateur.creer.useMutation({
      onSuccess: () => {
        setEstEnCoursDeModification(false);
        router.push(
          `/admin/indicateurs/${indicateur.indicId}?_action=creation-reussie`,
        );
      },
      onError: (error) => {
        setAlerte({
          type: "erreur",
          titre: error.message,
        });
      },
    });

  const creerIndicateur: SubmitHandler<
    MetadataIndicateurForm & { indicId: string }
  > = async (data) => {
    const inputs = {
      csrf: récupérerUnCookie("csrf") ?? "",
      ...data,
      indicParentIndic:
        data.indicParentIndic === "Aucun indicateur sélectionné"
          ? null
          : data.indicParentIndic,
    };

    mutationCreerMetadataIndicateur.mutate(inputs);
  };

  const modifierIndicateur: SubmitHandler<
    MetadataIndicateurForm & { indicId: string }
  > = async (data) => {
    const inputs = {
      csrf: récupérerUnCookie("csrf") ?? "",
      ...data,
      indicParentIndic:
        data.indicParentIndic === "Aucun indicateur sélectionné"
          ? null
          : data.indicParentIndic,
    };

    mutationModifierMetadataIndicateur.mutate(inputs);
  };

  const reinitialiserIndicateur = () => {
    reactHookForm.reset();
    setEstEnCoursDeModification(false);
  };

  return {
    estEnCoursDeModification,
    setEstEnCoursDeModification,
    modifierIndicateur,
    creerIndicateur,
    reactHookForm,
    alerte,
    reinitialiserIndicateur,
  };
};
