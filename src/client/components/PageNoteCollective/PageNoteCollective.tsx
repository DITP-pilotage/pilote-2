import Head from "next/head";
import { useRouter } from "next/router";
import { pageNoteCollective } from "@/components/Evaluation/PageNoteCollectiveServerSideContext";
import { TableauNoteCollective } from "@/components/Evaluation/TableauNoteCollective";
import JaugeDeProgression from "@/components/_commons/JaugeDeProgression/JaugeDeProgression";
import { NavigationTertiaire } from "@/components/_commons/NavigationTertiaire/NavigationTertiaire";

export const ContenuPageNoteCollective = () => {
  const router = useRouter();
  const { chantiersEvaluation, rattachements, rattachementCode } =
    pageNoteCollective.useServerSidePropsContext();

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

  const handleRattachementChange = (code: string) => {
    router.push(`/evaluation/note-collective/${code}`, undefined, {
      scroll: false,
    });
  };

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
            <NavigationTertiaire
              items={rattachements.map((r) => ({
                value: r.code,
                label: r.libelle,
              }))}
              onValueChange={handleRattachementChange}
              value={rattachementCode}
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
            <TableauNoteCollective />
          </div>
        </div>
      </div>
    </main>
  );
};
