import { SubmitHandler, useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/router";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/server/infrastructure/api/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { validationMetadataIndicateurFormulaire } from "@/validation/metadataIndicateur";
import AlerteProps from "@/components/_commons/Alerte/Alerte.interface";

export type MetadataIndicateurForm = {
  indicParentCh: string;
  indicParentIndic: string;
  indicNom: string;
  indicDescr: string;
  indicType: string;
  indicUnite: string | null;
  indicSchema: string;
  zgApplicable: string;
  indicTerritorialise: boolean;
  indicIsBaro: boolean;
  indicMethodeCalcul: string;
  indicSource: string;
  indicSourceUrl: string | null;
  periodicite: string;
  delaiDisponibilite: string;
  indicNomBaro: string | null;
  indicDescrBaro: string | null;
  paramVacaDecumulFrom: string;
  paramVacaPartitionDate: string;
  paramVacaOp: string;
  paramVacgDecumulFrom: string;
  paramVacgPartitionDate: string;
  paramVacgOp: string;
  tendance: string;
  viDeptFrom: string;
  viDeptOp: string;
  vaDeptFrom: string;
  vaDeptOp: string;
  vcDeptFrom: string;
  vcDeptOp: string;
  viRegFrom: string;
  viRegOp: string;
  vaRegFrom: string;
  vaRegOp: string;
  vcRegFrom: string;
  vcRegOp: string;
  viNatFrom: string;
  viNatOp: string;
  vaNatFrom: string;
  vaNatOp: string;
  vcNatFrom: string;
  vcNatOp: string;
  indicHiddenPilote: string;
  poidsPourcentDept: string;
  poidsPourcentReg: string;
  poidsPourcentNat: string;
  poidsPourcentEvalNat: string;
  poidsPourcentEvalReg: string;
  poidsPourcentEvalDept: string;
  indicIsPerseverant: boolean;
  indicIsPhare: boolean;
  reformePrioritaire: string | null;
  projetAnnuelPerf: boolean;
  detailProjetAnnuelPerf: string | null;
  frequenceTerritoriale: string;
  mailles: string | null;
  adminSource: string;
  methodeCollecte: string | null;
  siSource: string | null;
  donneeOuverte: boolean;
  modalitesDonneeOuverte: string | null;
  respDonnees: string | null;
  respDonneesEmail: string | null;
  contactTechnique: string | null;
  contactTechniqueEmail: string;
  commentaire: string | null;
  maillePilotage: string;
  cibleAttendue: boolean;
  couvertureTemporelle: string;
};

export const usePageIndicateur = (
  indicateur: MetadataParametrageIndicateurContrat,
) => {
  const router = useRouter();
  const [alerte, setAlerte] = useState<AlerteProps | null>(null);
  const [estEnCoursDeModification, setEstEnCoursDeModification] =
    useState<boolean>(false);

  const reactHookForm = useForm<MetadataIndicateurForm>({
    resolver: zodResolver(validationMetadataIndicateurFormulaire),
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
