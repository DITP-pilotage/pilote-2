import Head from "next/head";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import { $Enums } from "@prisma/client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/router";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { configurationFeatureFlip } from "@/config";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";
import api from "@/server/infrastructure/api/trpc/api";
import "@gouvfr/dsfr/dist/component/select/select.min.css"; // A Supprimer
import "@gouvfr/dsfr/dist/component/form/form.min.css"; // A Supprimer

import {
  parametrageUtilisateurPiloteEvalSchema,
  ParametrageUtilisateurPiloteEvalFormulaire,
} from "@/validation/parametrageUtilisateurPiloteEval";
import MultiSelect from "@/components/_commons/MultiSelectNew/MultiSelect";

export const getServerSideProps = async ({
  req,
  res,
  params,
}: GetServerSidePropsContext) => {
  const session = await getServerSession(req, res, authOptions);

  assert(session);

  const featureFlipping = configurationFeatureFlip();

  if (
    !featureFlipping.piloteEval ||
    !session.applicationsAccessibles.includes(
      $Enums.application_accessible.PILOTE_EVAL_PILOTAGE,
    )
  ) {
    return {
      redirect: {
        destination: "/404",
      },
    };
  }

  const utilisateurId = params?.id as string;

  const container = getContainer("piloteEval");

  const [criteres, rattachements, objectifsParRattachement, utilisateur] =
    await Promise.all([
      container.resolve("listerCriteresPiloteEval").run(),
      container.resolve("listerRattachementsPiloteEval").run(),
      container.resolve("listerObjectifsParRattachementPiloteEval").run({
        jalon: 2025,
      }),
      container.resolve("recupererDroitsUtilisateurQuery").run({
        utilisateurId,
        jalon: 2025,
      }),
    ]);

  return {
    props: {
      utilisateurId,
      criteres,
      rattachements,
      objectifsParRattachement,
      utilisateur,
    },
  };
};

const UtilisateurDetailPage = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
  const { utilisateurId, criteres, rattachements, utilisateur } = props;

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

  return (
    <main className="py-6 pt-0">
      <Head>
        <title>PILOTE - Configuration des droits utilisateur</title>
      </Head>

      <div className="min-h-[60vh] py-12">
        <div className="mx-auto w-full max-w-6xl">
          <header className="mb-6">
            <h1 className="!text-3xl font-bold mb-4">
              Configuration des droits - Utilisateur
            </h1>
            <p className="font-bold text-italic">{email}</p>
          </header>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-6">
              <section className="bg-white p-6 rounded shadow-sm">
                <Controller
                  control={control}
                  name="autoEvaluation.rattachementCodes"
                  render={({ field }) => (
                    <MultiSelect
                      changementValeursSélectionnéesCallback={field.onChange}
                      label="Auto-évaluation"
                      optionsGroupées={rattachementsOptionsGroupees}
                      suffixeLibellé="territoire(s) sélectionné(s)"
                      valeursSélectionnéesParDéfaut={field.value}
                    />
                  )}
                />
              </section>

              <section className="bg-white p-6 rounded shadow-sm">
                <Controller
                  control={control}
                  name="consolidation.rattachementCodes"
                  render={({ field }) => (
                    <MultiSelect
                      changementValeursSélectionnéesCallback={field.onChange}
                      label="Consolidation"
                      optionsGroupées={rattachementsOptionsGroupees}
                      suffixeLibellé="territoire(s) sélectionné(s)"
                      valeursSélectionnéesParDéfaut={field.value}
                    />
                  )}
                />
              </section>

              <section className="bg-white p-6 rounded shadow-sm">
                <Controller
                  control={control}
                  name="instructionObjectifs.rattachementCodes"
                  render={({ field }) => (
                    <MultiSelect
                      changementValeursSélectionnéesCallback={field.onChange}
                      label="Instruction - Objectifs"
                      optionsGroupées={rattachementsOptionsGroupees}
                      suffixeLibellé="territoire(s) sélectionné(s)"
                      valeursSélectionnéesParDéfaut={field.value}
                    />
                  )}
                />
              </section>

              <section className="bg-white p-6 rounded shadow-sm">
                <Controller
                  control={control}
                  name="instructionManiereDeServir.critereCodes"
                  render={({ field }) => (
                    <MultiSelect
                      changementValeursSélectionnéesCallback={field.onChange}
                      label="Instruction - Manière de servir"
                      optionsGroupées={criteresOptionsGroupees}
                      suffixeLibellé="critère(s) sélectionné(s)"
                      valeursSélectionnéesParDéfaut={field.value}
                    />
                  )}
                />
              </section>

              <div className="flex justify-end mt-6">
                <button className="fr-btn" type="submit">
                  Enregistrer la configuration
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default UtilisateurDetailPage;
