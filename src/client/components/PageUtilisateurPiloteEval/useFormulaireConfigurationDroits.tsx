import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/router";
import api from "@/server/infrastructure/api/trpc/api";
import {
  parametrageUtilisateurPiloteEvalSchema,
  ParametrageUtilisateurPiloteEvalFormulaire,
} from "@/validation/parametrageUtilisateurPiloteEval";
import { pageUtilisateurPiloteEval } from "@/components/PageUtilisateurPiloteEval/PageUtilisateurPiloteEvalServerSideContext";

export const useFormulaireConfigurationDroits = () => {
  const { utilisateurId, criteres, rattachements, utilisateur } =
    pageUtilisateurPiloteEval.useServerSidePropsContext();

  const router = useRouter();
  const modifierDroits = api.evaluation.modifierDroitsUtilisateur.useMutation();

  const { email, droitsUtilisateur } = utilisateur;

  const { control, handleSubmit } =
    useForm<ParametrageUtilisateurPiloteEvalFormulaire>({
      resolver: zodResolver(parametrageUtilisateurPiloteEvalSchema),
      defaultValues: droitsUtilisateur,
    });

  const onSubmit = async (data: ParametrageUtilisateurPiloteEvalFormulaire) => {
    await modifierDroits.mutateAsync(
      {
        utilisateurId,
        jalon: 2025,
        autoEvaluation: {
          rattachementCodes: data.autoEvaluation.rattachementCodes,
        },
        consolidation: {
          rattachementCodes: data.consolidation.rattachementCodes,
        },
        instructionObjectifs: {
          rattachementCodes: data.instructionObjectifs.rattachementCodes,
        },
        instructionManiereDeServir: {
          critereCodes: data.instructionManiereDeServir.critereCodes,
        },
      },
      {
        onSuccess: async () => {
          toast.success("Droits modifiés avec succès", {
            position: "top-right",
            richColors: true,
          });
          await router.push("/evaluation/utilisateurs");
        },
        onError: () => {
          toast.error("Erreur lors de la modification des droits", {
            position: "top-right",
            richColors: true,
          });
        },
      },
    );
  };

  const rattachementsGroupes = rattachements.reduce(
    (acc, rattachement) => {
      const groupe = rattachement.groupe;
      if (!acc[groupe]) {
        acc[groupe] = [];
      }
      acc[groupe].push({
        value: rattachement.code,
        label: rattachement.libelle,
      });
      return acc;
    },
    {} as Record<string, { value: string; label: string }[]>,
  );

  const rattachementsOptionsGroupees = Object.entries(rattachementsGroupes).map(
    ([groupe, options]) => ({
      label: groupe,
      options,
    }),
  );

  const criteresOptionsGroupees = [
    {
      label: "Critères",
      options: criteres.map((critere) => ({
        value: critere.id,
        label: critere.libelle,
      })),
    },
  ];

  return {
    email,
    control,
    handleSubmit,
    onSubmit,
    rattachementsOptionsGroupees,
    criteresOptionsGroupees,
  };
};
