import { Lien } from "@/components/_commons/Lien/Lien";
import { ModaleTransmissionDITP } from "@/components/PageAppreciation/ModaleVerrouillageConsolidation/ModaleVerrouillageConsolidation";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { pageAppreciation } from "@/components/PageAppreciation/PageAppreciationServerSideContext";

export const InformationEnteteAppreciation = ({
  statutCompletionAppreciation = "PAS_DEBUTE",
}: {
  statutCompletionAppreciation:
    | "PAS_DEBUTE"
    | "AUTO_EVAL_EN_COURS"
    | "APPRECIATION_EN_COURS"
    | "TERMINE";
}) => {
  const { fichesParGroupePuisPhase } =
    pageAppreciation.useServerSidePropsContext();
  const fiches = Object.values(fichesParGroupePuisPhase)
    .map((groupes) => groupes.CONSOLIDATION)
    .flat();
  if (statutCompletionAppreciation === "PAS_DEBUTE") {
    return null;
  }
  if (statutCompletionAppreciation === "AUTO_EVAL_EN_COURS") {
    return null;
  }
  if (statutCompletionAppreciation === "APPRECIATION_EN_COURS") {
    return (
      <div className="grid md:grid-cols-2 mt-10 gap-6">
        <div className="bg-dsfr-grey-1000 border !border-b-2 !border-dsfr-grey-900 !border-b-primary py-6 px-8 flex flex-col gap-4">
          <h3 className="!text-primary !text-2xl !mb-6">
            Renseigner les appréciations
          </h3>
          <div className="flex flex-col gap-1">
            <p className="!mb-0">
              L'espace d'appréciation vous permet de saisir vos appréciations
              (résultats quantitatifs et commentaires) :
            </p>
            <ul className="!m-0">
              <li>
                pour chaque objectif individuel et chaque axe de la manière de
                servir,
              </li>
              <li>et pour tous les territoires de votre région.</li>
            </ul>
          </div>
          <div className="mt-auto">
            <Lien
              className="!w-full !justify-center"
              href="appreciation/espace-appreciation"
              label="Accéder à l'espace d'appréciation"
              variant="button"
            />
          </div>
        </div>

        <div className="bg-dsfr-grey-1000 border !border-b-2 !border-dsfr-grey-900 !border-b-primary py-6 px-8 flex flex-col gap-4">
          <h3 className="!text-primary !text-2xl !mb-6">
            Transmettre les appréciations
          </h3>
          <div className="flex flex-col gap-1">
            <p className="!mb-0">
              À tout moment, vous pouvez transmettre vos appréciations afin
              qu'elles soient instruites par les administrations centrales.
            </p>
            <p className="!mb-0">
              Le parcours ci-dessous vous permet de choisir les territoires dont
              vous souhaitez transmettre les appréciations. À ce titre, vous
              pouvez transmettre vos appréciations en plusieurs fois.
            </p>
          </div>

          <div className="mt-auto">
            <ModaleTransmissionDITP fichesAppreciation={fiches}>
              <Bouton
                className="!w-full !justify-center"
                label="Transmettre les appréciations"
                variant="primary"
              />
            </ModaleTransmissionDITP>
          </div>
        </div>
      </div>
    );
  }

  if (statutCompletionAppreciation === "TERMINE") {
    return (
      <div className="mt-10">
        <h3 className="!text-primary !text-2xl !mb-4">Vos appréciations</h3>
        <p className="!mb-0">
          La phase d'appréciation est close, toutes vos appréciations ont été
          transmises pour instruction.
        </p>
        <p>Nous vous remercions pour votre collaboration.</p>
        <div className="flex justify-center mb-4">
          <Lien
            href="appreciation/espace-appreciation"
            label="Consulter mon espace d'appréciation"
            variant="button-secondary"
          />
        </div>
      </div>
    );
  }
};
