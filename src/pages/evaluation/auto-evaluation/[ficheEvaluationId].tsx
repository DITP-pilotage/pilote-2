import Head from "next/head";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormEvent, useId, useState } from "react";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import assert from "node:assert";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { ArrowLine1Icon } from "@/components/_commons/Icones/ArrowLine1Icon";
import { EtapeCriteres } from "@/components/PageEvaluation/EtapeCriteres";
import { formSchema, FormValues } from "@/components/PageEvaluation/form";
import { ArrowLine3Icon } from "@/components/_commons/Icones/ArrowLine3Icon";
import { EtapeObjectifs } from "@/components/PageEvaluation/EtapeObjectifs";
import { formaterDate } from "@/client/utils/date/date";
import { getContainer } from "@/server/dependances";
import { pageEvaluation } from "@/components/PageEvaluation/PageEvaluationServerSideContext";
import { configurationFeatureFlip } from "@/config";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";
import { ApplicationAccessible } from "@/server/domain/utilisateur/Utilisateur.interface";
import { BoutonEnregistrerBrouillon } from "@/components/PageEvaluation/BoutonEnregistrerBrouillon";

export const getServerSideProps = async ({
  req,
  res,
  params,
}: GetServerSidePropsContext) => {
  const session = await getServerSession(req, res, authOptions);
  const ficheEvaluationId = z.string().parse(params?.ficheEvaluationId);

  assert(session);

  const featureFlipping = configurationFeatureFlip();

  if (
    !featureFlipping.piloteEval ||
    !session.applicationsAccessibles.includes(ApplicationAccessible.PILOTE_EVAL)
  ) {
    return {
      redirect: {
        destination: "404",
      },
    };
  }

  const autoEvaluation = await getContainer("piloteEval")
    .resolve("afficherAutoEvaluation")
    .run({ ficheEvaluationId });

  return { props: { autoEvaluation } };
};

const AutoEvaluationPage = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
  const { autoEvaluation } = props;
  const [etape, setEtape] = useState<"criteres" | "objectifs">("criteres");
  const formId = useId();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      criteres: autoEvaluation.criteres.map((critere) => ({
        sousCriteres: critere.sousCriteres.map((sousCritere) => ({
          id: sousCritere.evaluation.id,
          note: sousCritere.evaluation.note ?? undefined,
          commentaire: sousCritere.evaluation.commentaire ?? undefined,
        })),
      })),
      objectifs: autoEvaluation.objectifs.map((objectif) => ({
        id: objectif.evaluation.id,
        note: objectif.evaluation.note ?? undefined,
        commentaire: objectif.evaluation.commentaire ?? undefined,
      })),
    },
  });

  const handleSubmitCriteres = async (e: FormEvent) => {
    e.preventDefault();
    const isValid = await form.trigger("criteres", {
      shouldFocus: true,
    });
    if (!isValid) return;

    setEtape("objectifs");
    window.scrollTo(0, 0);
  };

  const handleSubmit =
    etape === "criteres"
      ? handleSubmitCriteres
      : form.handleSubmit((data) => {
          console.log("TODO: soumettre pour consolidation", data);
        });

  return (
    <pageEvaluation.ServerSidePropsProvider value={props}>
      <main className="py-6 pt-0">
        <FormProvider {...form}>
          <Head>
            <title>PILOTE - Auto-évaluation</title>
          </Head>

          <div className="min-h-[60vh] relative">
            <div className="sticky top-0 bg-white mb-6">
              <div className="flex items-center justify-between mt-4 mx-auto w-full max-w-4xl px-2 py-4">
                <span className="italic text-sm">
                  Dernière modification :{" "}
                  {formaterDate(
                    autoEvaluation.dateDerniereModification,
                    "DD/MM/YYYY [à] H[h]mm",
                  )}
                </span>
                {etape === "criteres" && (
                  <div className="ml-auto flex items-center gap-4">
                    <BoutonEnregistrerBrouillon />
                    <Bouton
                      form={formId}
                      iconRight={
                        <Icone
                          className="text-current"
                          icone={ArrowLine1Icon}
                        />
                      }
                      label="Objectifs"
                      type="submit"
                    />
                  </div>
                )}
                {etape === "objectifs" && (
                  <div className="ml-auto flex items-center gap-4">
                    <Bouton
                      iconLeft={
                        <Icone
                          className="text-current"
                          icone={ArrowLine3Icon}
                        />
                      }
                      label="Critères"
                      onClick={() => setEtape("criteres")}
                      variant="secondary"
                    />

                    <BoutonEnregistrerBrouillon />

                    <Bouton form={formId} label="Soumettre" type="submit" />
                  </div>
                )}
              </div>
            </div>
            <form
              className="bg-white mx-auto w-full max-w-4xl"
              id={formId}
              onSubmit={handleSubmit}
            >
              <header className="p-4 bg-dsfr-blue-france-925 border-b-2 border-black">
                <span className="font-bold text-sm">Mon auto-évaluation</span>
              </header>

              {etape === "criteres" && <EtapeCriteres />}
              {etape === "objectifs" && <EtapeObjectifs />}
            </form>
          </div>
        </FormProvider>
      </main>
    </pageEvaluation.ServerSidePropsProvider>
  );
};

export default AutoEvaluationPage;
