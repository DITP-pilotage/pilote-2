import Head from "next/head";
import { useRouter } from "next/router";
import { pageNoteCollective } from "@/components/Evaluation/PageNoteCollectiveServerSideContext";
import { TableauNoteCollective } from "@/components/Evaluation/TableauNoteCollective";
import JaugeDeProgression from "@/components/_commons/JaugeDeProgression/JaugeDeProgression";
import Sélecteur from "@/client/components/_commons/Sélecteur/Sélecteur";
import { formatterTitreEvaluation } from "@/client/components/PageAppreciation/utilsTexteEvaluation";

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
            <h1 className="!text-3xl font-bold mb-2">
              Les résultats des objectifs collectifs sur votre territoire
            </h1>
          </header>
          <div className="flex flex-col bg-white rounded shadow p-6 gap-8">
            <div>
              <h2 className="!text-2xl font-bold !mb-0 !text-primary">
                Les objectifs collectifs des préfets
              </h2>
              <p className="!text-base !mt-4">
                Les préfets ont pour mission, sous l'autorité du Premier
                Ministre, d'animer et de coordonner l'ensemble des services
                déconcentrés de l'Etat et des représentations territoriales des
                établissements publics (à l'exclusion des activités
                juridictionnelles et militaires) pour assurer la mise en œuvre
                effective des priorités de l'action gouvernementale.
              </p>
              <p className="!mb-0">
                Cette page vous permet de retrouver la liste des objectifs
                collectifs retenus pour cette année sur votre territoire et de
                prendre connaissance des résultats pris en compte dans leur
                évaluation. Ces objectifs recoupent en partie la liste des
                chantiers accessibles sur PILOTE.
              </p>
            </div>
            <div>
              <h2 className="!text-2xl font-bold !mb-4 !text-primary">
                Les résultats des objectifs collectifs sur votre territoire
              </h2>
              <div className="flex items-center gap-2 w-fit">
                <span className="pt-2">Territoire : </span>
                <Sélecteur
                  htmlName="select-territoire"
                  options={rattachements.map((rattachement) => {
                    return {
                      valeur: rattachement.code,
                      libellé: rattachement.libelle,
                    };
                  })}
                  valeurModifiéeCallback={handleRattachementChange}
                  valeurSélectionnée={rattachementCode}
                />
              </div>
            </div>
            {moyenneNote !== null && moyenneNote.count > 0 && (
              <div>
                <h3 className="!text-xl !mb-4">
                  Taux d'atteinte des objectifs collectifs pour l'année 2025
                </h3>
                <p>
                  Taux constaté sur l'ensemble des chantiers et indicateurs
                  retenus pour l'évaluation de l'année en cours (après saisie
                  finalisée des données des indicateurs par les ministères en
                  charge des chantiers)
                </p>
                <JaugeDeProgression
                  couleur="bleu"
                  libellé={formatterTitreEvaluation(
                    rattachements.find(
                      (rattachement) => rattachement.code === rattachementCode,
                    )!,
                  )}
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
