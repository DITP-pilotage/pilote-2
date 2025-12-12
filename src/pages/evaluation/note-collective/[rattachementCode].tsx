import Head from "next/head";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { $Enums } from "@prisma/client";
import { useRouter } from "next/router";
import { Tabs } from "radix-ui";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { configuration, configurationFeatureFlip } from "@/config";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";
import { TableauNoteCollective } from "@/components/Evaluation/TableauNoteCollective";
import JaugeDeProgression from "@/components/_commons/JaugeDeProgression/JaugeDeProgression";

export const getServerSideProps = async ({
  req,
  res,
  params,
}: GetServerSidePropsContext) => {
  const session = await getServerSession(req, res, authOptions);
  const rattachementCode = z.string().parse(params?.rattachementCode);

  assert(session);

  const featureFlipping = configurationFeatureFlip();

  const peutAccederEtapeAutoEvaluation = await getContainer("piloteEval")
    .resolve("accesFicheEvaluationService")
    .peutAccederEtapeAutoEvaluationRattachement({
      utilisateurId: session.user.id,
      rattachementCode,
    });

  if (
    !featureFlipping.piloteEval ||
    !session.applicationsAccessibles.includes(
      $Enums.application_accessible.PILOTE_EVAL,
    ) ||
    !peutAccederEtapeAutoEvaluation
  ) {
    return {
      redirect: {
        destination: "/404",
      },
    };
  }

  const container = getContainer("piloteEval");

  const rattachements = await container
    .resolve("getRattachementPourEtapeQuery")
    .run({
      utilisateurId: session.user.id,
      etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
    });

  const chantiersEvaluation = await container
    .resolve("recupererDetailsNoteCollectiveQuery")
    .run({ rattachementCode, jalon: 2025 });

  const baseUrl = configuration().baseUrl;

  return {
    props: {
      chantiersEvaluation,
      rattachements,
      rattachementCode,
      baseUrl,
    },
  };
};

type NavigationRattatchementsProps = {
  rattachements: { code: string; libelle: string }[];
  rattachementCode: string;
};

const NavigationRattachements = ({
  rattachements,
  rattachementCode,
}: NavigationRattatchementsProps) => {
  const router = useRouter();

  const handleValueChange = (newCode: string) => {
    router.push(`/evaluation/note-collective/${newCode}`);
  };

  return (
    <Tabs.Root onValueChange={handleValueChange} value={rattachementCode}>
      <Tabs.List className="flex gap-1 border-b">
        {rattachements.map((rattachement) => (
          <Tabs.Trigger
            className="px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 !border-b-2 !border-transparent !data-[state=active]:border-primary data-[state=active]:text-blue-600"
            key={rattachement.code}
            value={rattachement.code}
          >
            {rattachement.libelle}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
};

const PageDetailsNoteCollective = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
  const { chantiersEvaluation, rattachements, rattachementCode, baseUrl } =
    props;

  const moyenneNote =
    chantiersEvaluation.length > 0
      ? chantiersEvaluation.reduce(
          (acc, chantier) => ({
            total: acc.total + (chantier.tauxAvancement ?? 0),
            count: acc.count + (chantier.tauxAvancement !== null ? 1 : 0),
          }),
          { total: 0, count: 0 },
        )
      : null;

  return (
    <main className="py-6 pt-0">
      <Head>
        <title>PILOTE - Détails note collective</title>
      </Head>

      <div className="min-h-[60vh] py-12">
        <div className="mx-auto w-full max-w-6xl">
          <header className="mb-6">
            <h1 className="!text-3xl font-bold mb-2">Evaluation 2025</h1>
          </header>
          <div className="flex flex-col bg-white rounded shadow p-6 gap-8">
            <div>
              <h2 className="!text-2xl font-bold !mb-0 !text-primary">
                Calendrier
              </h2>
              <p className="!text-base !mt-4 !mb-0">
                La phase d'auto-évaluation des objectifs individuels et de la
                manière de servir est ouverte jusqu'à la fin du mois de janvier
                2026. À l'échéance qui vous a été fixée, les auto-évaluations
                incomplètes ou non validées seront automatiquement validées. Les
                objectifs collectifs ne font pas l'objet d'une auto-évaluation
                et sont mis à disposition à titre informatif. Ils seront évalués
                à partir des résultats constatés dans PILOTE.
              </p>
            </div>
            <h2 className="!text-2xl font-bold !mb-0 !text-primary">
              Votre note sur les objectifs collectifs
            </h2>
            <NavigationRattachements
              rattachementCode={rattachementCode}
              rattachements={rattachements}
            />
            {moyenneNote !== null && moyenneNote.count > 0 && (
              <div>
                <h3 className="!text-xl !mb-0">Note collective</h3>
                <JaugeDeProgression
                  couleur="bleu"
                  libellé=""
                  pourcentage={Math.round(
                    moyenneNote.total / moyenneNote.count,
                  )}
                  taille="lg"
                />
              </div>
            )}
            <TableauNoteCollective
              baseUrl={baseUrl}
              chantiersEvaluation={chantiersEvaluation}
              rattachement={rattachementCode}
            />
          </div>
        </div>
      </div>
    </main>
  );
};

export default PageDetailsNoteCollective;
