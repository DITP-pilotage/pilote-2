import Head from "next/head";
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { $Enums } from "@prisma/client";
import Image from "next/image";
import carteFranceSvg from "@gouvfr/dsfr/dist/artwork/pictograms/map/location-france.svg";
import visualisationDonnéesSvg from "@gouvfr/dsfr/dist/artwork/pictograms/digital/data-visualization.svg";
import cityHallSvg from "@gouvfr/dsfr/dist/artwork/pictograms/buildings/city-hall.svg";
import assert from "node:assert";
import { configurationFeatureFlip } from "@/config";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";

export const getServerSideProps = async ({
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = await getServerSession(req, res, authOptions);

  assert(session);

  const featureFlipping = configurationFeatureFlip();

  if (
    !featureFlipping.piloteEval ||
    !session.applicationsAccessibles.includes(
      $Enums.application_accessible.PILOTE_EVAL,
    )
  ) {
    return {
      redirect: {
        destination: "/404",
      },
    };
  }

  return { props: {} };
};

const AccueilEvaluationPage = () => {
  return (
    <main className="py-6 pt-0 !bg-white">
      <Head>
        <title>PILOTE - Évaluation</title>
      </Head>

      <div className="min-h-[60vh] py-12">
        <div className="mx-auto w-full max-w-6xl">
          <header className="mb-9">
            <h1 className="!text-3xl font-bold">Bienvenue sur PILOTE Éval</h1>
          </header>
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="!text-2xl !text-primary !mb-4">
                L'outil unique d'évaluation des objectifs interministériels des
                préfets
              </h2>
              <p className="!mb-0">
                PILOTE Éval est un outil de{" "}
                <span className="font-bold text-primary">La Suite PILOTE</span>,
                pensé pour rendre compte des résultats des objectifs collectifs,
                des objectifs individuels et la manière de servir de chaque
                préfet.
              </p>
            </div>
            <div>
              <h2 className="!text-2xl !text-primary !mb-4">
                À quoi sert PILOTE Éval ?
              </h2>
              <p className="!mb-2">
                PILOTE Éval est l'outil d'évaluation des objectifs
                interministériels assignés aux préfets par le Premier Ministre.
                Il est mis à disposition par la Direction interministérielle de
                la transformation publique.
              </p>
              <p className="!mb-2">Il permet de :</p>
              <ul className="list-disc !mb-0">
                <li>
                  Suivre les résultats des objectifs interministériels pour
                  chacune de leurs composantes :
                  <ul className="list-disc !mb-0">
                    <li>les objectifs collectifs,</li>
                    <li>les objectifs individuels,</li>
                    <li>la manière de servir.</li>
                  </ul>
                </li>
                <li>
                  Centraliser les données pour chaque préfet, en mettant à
                  disposition les résultats retenus pour leur territoire dans le
                  cadre de l'évaluation.
                </li>
                <li>
                  Faciliter l'appréciation des résultats des préfets de
                  département par les préfets de région, conformément aux
                  instructions ministérielles.
                </li>
                <li>
                  Contribuer à la fixation du montant du complément indemnitaire
                  annuel des préfets (à hauteur de 50%).
                </li>
              </ul>
            </div>
            <div>
              <h2 className="!text-2xl !text-primary !mb-4">
                Ce que vous pouvez faire avec PILOTE Éval
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="border border-dsfr-grey-900">
                  <div className="relative h-32 bg-dsfr-grey-1000">
                    <Image
                      alt=""
                      className="object-contain"
                      fill
                      src={carteFranceSvg}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="!text-xl !mb-3">Pour tous les préfets</h3>
                    <span className="!font-bold">
                      Tableau de bord personnalisé des résultats par préfet :
                    </span>{" "}
                    accédez à vos résultats mis à jour et pris en compte pour
                    votre évaluation.
                  </div>
                </div>

                <div className="border border-dsfr-grey-900">
                  <div className="relative h-32 bg-dsfr-grey-1000">
                    <Image
                      alt=""
                      className="object-contain"
                      fill
                      src={visualisationDonnéesSvg}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="!text-xl !mb-3">
                      Pour les préfets de régions
                    </h3>
                    <span className="!font-bold">
                      Appréciation des résultats :
                    </span>{" "}
                    renseignez et transmettez vos propositions d'évaluation des
                    objectifs individuels et de la manière de servir dans votre
                    région.
                  </div>
                </div>

                <div className="border border-dsfr-grey-900">
                  <div className="relative h-32 bg-dsfr-grey-1000">
                    <Image
                      alt=""
                      className="object-contain"
                      fill
                      src={cityHallSvg}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="!text-xl !mb-3">
                      Pour les administrations centrales
                    </h3>
                    <span className="!font-bold">
                      Instruction interministérielle :
                    </span>{" "}
                    prenez part à l'instruction des composantes de l'évaluation
                    qui concernent votre administration.
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="!text-2xl !text-primary !mb-4">
                Déroulé de l'évaluation des objectifs interministériels des
                préfets
              </h2>
              <ul className="list-disc !mb-0">
                <li>
                  <span className="!font-bold">Étape 1 :</span> Les préfets de
                  région apprécient les résultats obtenus pour l'année N-1 pour
                  chaque préfet de département pour leurs objectifs individuels
                  et leur manière de servir.
                </li>
                <li>
                  <span className="!font-bold">Étape 2 :</span> Les préfets
                  prennent connaissance de leurs résultats retenus dans le cadre
                  de l'évaluation des objectifs collectifs pour l'année N-1.
                </li>
                <li>
                  <span className="!font-bold">Étape 3 :</span> Les résultats de
                  chaque préfet sont consolidés lors d'une phase d'instruction
                  interministérielle.
                </li>
                <li>
                  <span className="!font-bold">Étape 4 :</span> Les préfets
                  peuvent proposer les objectifs individuels qu'ils souhaitent
                  mettre en œuvre pour l'année en cours et sur lesquels ils
                  seront évalués l'année suivante.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AccueilEvaluationPage;
