import Head from "next/head";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { InferGetServerSidePropsType } from "next";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { ArrowLine1Icon } from "@/components/_commons/Icones/ArrowLine1Icon";
import { EtapeCriteres } from "@/components/PageEvaluation/EtapeCriteres";
import { formSchema, FormValues } from "@/components/PageEvaluation/form";
import { ArrowLine3Icon } from "@/components/_commons/Icones/ArrowLine3Icon";
import { EtapeObjectifs } from "@/components/PageEvaluation/EtapeObjectifs";
import { formaterDate } from "@/client/utils/date/date";
import { getContainer } from "@/server/dependances";

export const getServerSideProps = async () => {
  const autoEvaluation = await getContainer("piloteEval")
    .resolve("afficherAutoEvaluation")
    .run();
  return { props: { autoEvaluation } };
};

export default function EvaluationPage({
  autoEvaluation,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [etape, setEtape] = useState<"criteres" | "objectifs">("criteres");
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      criteres: autoEvaluation.criteres.map((critere) => ({
        sousCriteres: critere.sousCriteres.map(
          (sousCritere) => sousCritere.evaluation,
        ),
      })),
      objectifs: autoEvaluation.objectifs.map(
        (objectif) => objectif.evaluation,
      ),
    },
  });

  console.log(form.watch());

  return (
    <main className="py-6">
      <Head>
        <title>PILOTE - Évaluation</title>
      </Head>

      <div className="min-h-[60vh]">
        <section className="bg-white mx-auto w-full max-w-4xl">
          <header className="p-4 bg-dsfr-blue-france-925 border-b-2 border-black">
            <span className="font-bold text-sm">Mon auto-évaluation</span>
          </header>
          <FormProvider {...form}>
            {etape === "criteres" && (
              <EtapeCriteres criteres={autoEvaluation.criteres} />
            )}
            {etape === "objectifs" && (
              <EtapeObjectifs objectifs={autoEvaluation.objectifs} />
            )}
          </FormProvider>
        </section>
      </div>

      <div className="sticky flex items-center justify-between mt-4 bottom-8 mx-auto w-full max-w-4xl bg-white px-6 py-4">
        <span className="italic text-sm">
          Dernière modification : {formaterDate("2025-10-01", "DD/MM/YYYY")}
        </span>
        {etape === "criteres" && (
          <Bouton
            className="ml-auto"
            iconRight={
              <Icone className="text-current" icone={ArrowLine1Icon} />
            }
            label="Objectitfs"
            onClick={() => {
              setEtape("objectifs");
              window.scrollTo(0, 0);
            }}
          />
        )}
        {etape === "objectifs" && (
          <div className="ml-auto flex items-center gap-4">
            <Bouton
              iconLeft={
                <Icone className="text-current" icone={ArrowLine3Icon} />
              }
              label="Critères"
              onClick={() => setEtape("criteres")}
              variant="secondary"
            />
            <Bouton
              label="Soumettre"
              onClick={() => console.log("Hello world")}
            />
          </div>
        )}
      </div>
    </main>
  );
}
