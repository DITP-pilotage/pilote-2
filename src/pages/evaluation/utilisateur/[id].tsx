import Head from "next/head";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import { $Enums } from "@prisma/client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { configurationFeatureFlip } from "@/config";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";
import "@gouvfr/dsfr/dist/component/select/select.min.css"; // A Supprimer
import "@gouvfr/dsfr/dist/component/form/form.min.css"; // A Supprimer

import {
  parametrageUtilisateurPiloteEvalSchema,
  ParametrageUtilisateurPiloteEvalFormulaire,
} from "@/validation/parametrageUtilisateurPiloteEval";
import MultiSelect from "@/components/_commons/MultiSelectNew/MultiSelect";

type ObjectifPiloteEval = {
  id: string;
  libelle: string;
};

type AccordeonGroupeProps = {
  groupe: string;
  rattachements: { value: string; label: string }[];
  objectifsParRattachement: Record<string, ObjectifPiloteEval[]>;
  selectedCodes: string[];
  onToggle: (code: string) => void;
};

const AccordeonGroupe = ({
  groupe,
  rattachements,
  objectifsParRattachement,
  selectedCodes,
  onToggle,
}: AccordeonGroupeProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded">
      <button
        className="w-full p-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 text-left"
        onClick={() => setExpanded(!expanded)}
        type="button"
      >
        <span className="font-semibold">{groupe}</span>
        <span className="text-gray-600">{expanded ? "▼" : "▶"}</span>
      </button>
      {expanded ? (
        <div className="p-3 space-y-2">
          {rattachements.map((rattachement) => {
            const objectifs =
              objectifsParRattachement[rattachement.value] || [];
            const isSelected = selectedCodes.includes(rattachement.value);

            return (
              <div
                className="border-l-2 border-blue-400 pl-3"
                key={rattachement.value}
              >
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    checked={isSelected}
                    className="mt-1"
                    onChange={() => onToggle(rattachement.value)}
                    type="checkbox"
                  />
                  <div className="flex-1">
                    <span className="font-medium">{rattachement.label}</span>
                    {objectifs.length > 0 && (
                      <ul className="mt-1 text-sm text-gray-600 space-y-1">
                        {objectifs.map((objectif) => (
                          <li className="ml-4" key={objectif.id}>
                            • {objectif.libelle}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </label>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

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

  const [criteres, rattachements, objectifsParRattachement, droitsUtilisateur] =
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
      droitsUtilisateur,
    },
  };
};

const UtilisateurDetailPage = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
  const {
    utilisateurId,
    criteres,
    rattachements,
    objectifsParRattachement,
    droitsUtilisateur,
  } = props;

  const [ouvertInstructionObjectifs, setOuvertInstructionObjectifs] =
    useState(false);

  const { control, handleSubmit } =
    useForm<ParametrageUtilisateurPiloteEvalFormulaire>({
      resolver: zodResolver(parametrageUtilisateurPiloteEvalSchema),
      defaultValues: droitsUtilisateur,
    });

  const onSubmit = (data: ParametrageUtilisateurPiloteEvalFormulaire) => {
    console.log("Données du formulaire :", data);
    // TODO: implémenter la sauvegarde
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
            <p className="text-gray-600">ID: {utilisateurId}</p>
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
                  render={({ field }) => {
                    const nombreSelections = field.value.length;

                    return (
                      <div>
                        <label
                          className="fr-label font-semibold"
                          htmlFor="instruction-objectifs"
                        >
                          Instruction - Objectifs
                        </label>
                        <button
                          className="fr-select fr-ellipsis w-full text-left"
                          id="instruction-objectifs"
                          onClick={() =>
                            setOuvertInstructionObjectifs(
                              !ouvertInstructionObjectifs,
                            )
                          }
                          type="button"
                        >
                          {nombreSelections > 0
                            ? `${nombreSelections} territoire(s) sélectionné(s)`
                            : "Sélectionnez des territoires"}
                        </button>
                        {ouvertInstructionObjectifs ? (
                          <div className="border border-gray-300 rounded mt-2 max-h-96 overflow-y-auto bg-white">
                            <div className="p-4 space-y-4">
                              {Object.entries(rattachementsGroupes).map(
                                ([groupe, rattachementsGroupe]) => (
                                  <AccordeonGroupe
                                    groupe={groupe}
                                    key={groupe}
                                    objectifsParRattachement={
                                      objectifsParRattachement
                                    }
                                    onToggle={(code) => {
                                      const isSelected =
                                        field.value.includes(code);
                                      const newValue = isSelected
                                        ? field.value.filter((c) => c !== code)
                                        : [...field.value, code];
                                      field.onChange(newValue);
                                    }}
                                    rattachements={rattachementsGroupe}
                                    selectedCodes={field.value}
                                  />
                                ),
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  }}
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
