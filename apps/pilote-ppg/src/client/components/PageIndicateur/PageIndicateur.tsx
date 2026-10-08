import Link from "next/link";
import { Button } from "@/components/shared/Button";
import { FormProvider } from "react-hook-form";
import { FunctionComponent } from "react";
import FilAriane from "@/components/_commons/FilAriane/FilAriane";
import Bloc from "@/components/_commons/Bloc/Bloc";
import FicheIndicateur from "@/components/PageIndicateur/FicheIndicateur/FicheIndicateur";
import {
  MetadataIndicateurForm,
  usePageIndicateur,
} from "@/components/PageIndicateur/usePageIndicateur";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { MapInformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import { ChantierSynthétisé } from "@/shared/chantier/Chantier.interface";
import { InformationHistorisationMetadataIndicateurContrat } from "@/server/parametrage-indicateur/app/InformationDerniereModificationMetadataIndicateurContrat";
import { Icone } from "@/components/_commons/Icone";
import { ArrowLine3Icon } from "@/components/_commons/Icones/ArrowLine3Icon";

interface PageIndicateurProps {
  indicateur: MetadataParametrageIndicateurContrat;
  informationHistorisationIndicateur: InformationHistorisationMetadataIndicateurContrat;
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat;
  isCreation: boolean;
  modificationReussie: boolean;
  creationReussie: boolean;
  chantiers: ChantierSynthétisé[];
}

const PageIndicateur: FunctionComponent<PageIndicateurProps> = ({
  indicateur,
  informationHistorisationIndicateur,
  mapInformationMetadataIndicateur,
  isCreation,
  modificationReussie,
  creationReussie,
  chantiers,
}) => {
  const chemin = [
    {
      nom: "Gestion des indicateurs",
      lien: "/panel-administrateur/indicateurs",
    },
  ];

  const {
    reactHookForm,
    modifierIndicateur,
    creerIndicateur,
    estEnCoursDeModification,
    setEstEnCoursDeModification,
    alerte,
    reinitialiserIndicateur,
  } = usePageIndicateur(indicateur, mapInformationMetadataIndicateur);

  return (
    <div className="bg-dsfr-alt-blue-france fr-pt-2w">
      <main className="fr-container">
        <FilAriane chemin={chemin} libelléPageCourante="Indicateur" />
        <div className="fiche-indicateur fr-pt-1w fr-pb-13w">
          {!!alerte && (
            <div className="fr-mt-2w">
              <Alerte titre={alerte.titre} type={alerte.type} />
            </div>
          )}
          <FormProvider {...reactHookForm}>
            <form
              method="post"
              onSubmit={reactHookForm.handleSubmit(
                (data: MetadataIndicateurForm) => {
                  if (isCreation) {
                    creerIndicateur({ ...data, indicId: indicateur.indicId });
                  } else {
                    modifierIndicateur({
                      ...data,
                      indicId: indicateur.indicId,
                    });
                  }
                },
              )}
            >
              <div className="flex">
                <Link
                  aria-label="Retour à l'accueil"
                  className="flex items-center gap-2 !text-primary"
                  href="/panel-administrateur/indicateurs"
                >
                  <Icone className="w-4 h-4" icone={ArrowLine3Icon} />
                  Retour
                </Link>
              </div>
              {modificationReussie ? (
                <div className="fr-my-4w">
                  <Alerte
                    message="Les modifications ont bien été prises en compte pour cet indicateur. Elles apparaitront dans PILOTE lors de la prochaine mise à jour de données"
                    titre="Bravo, l'indicateur a bien été modifié !"
                    type="succès"
                  />
                </div>
              ) : null}
              {creationReussie ? (
                <div className="fr-my-4w">
                  <Alerte
                    message="La création a bien été prise en compte pour cet indicateur. Il apparaitra dans PILOTE lors de la prochaine mise à jour de données"
                    titre="Bravo, l'indicateur a bien été crée !"
                    type="succès"
                  />
                </div>
              ) : null}
              <h1 className="text-h1 md:text-h1-md mt-8">
                Fiche de l'indicateur {indicateur.indicId}
                <div className="fr-grid-row fr-mt-4w">
                  {isCreation ? (
                    <Button
                      variant="primary"
                      className="mr-4"
                      key="submit-creer-indicateur-top"
                      type="submit"
                    >
                      Créer l'indicateur
                    </Button>
                  ) : estEnCoursDeModification ? (
                    <>
                      <Button
                        variant="primary"
                        className="mr-4"
                        key="submit-modifier-indicateur-top"
                        type="submit"
                      >
                        Confirmer les changements
                      </Button>
                      <Button
                        variant="secondary"
                        className="mr-4"
                        key="submit-reinitialiser-indicateur-top"
                        onClick={reinitialiserIndicateur}
                        type="button"
                      >
                        Annuler
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="primary"
                      className="mr-4"
                      key="passer-en-modification"
                      onClick={() =>
                        setEstEnCoursDeModification(!estEnCoursDeModification)
                      }
                      type="button"
                    >
                      Modifier
                    </Button>
                  )}
                </div>
              </h1>
              <Bloc>
                <div className="fr-py-4w fr-px-10w">
                  <FicheIndicateur
                    chantiers={chantiers}
                    estEnCoursDeModification={
                      isCreation || estEnCoursDeModification
                    }
                    indicateur={indicateur}
                    informationHistorisationIndicateur={
                      informationHistorisationIndicateur
                    }
                    mapInformationMetadataIndicateur={
                      mapInformationMetadataIndicateur
                    }
                  />
                  {isCreation ? (
                    <Button
                      variant="primary"
                      className="mr-4"
                      key="submit-creer-indicateur-top"
                      type="submit"
                    >
                      Créer l'indicateur
                    </Button>
                  ) : estEnCoursDeModification ? (
                    <>
                      <Button
                        variant="primary"
                        className="mr-4"
                        key="submit-modifier-indicateur-top"
                        type="submit"
                      >
                        Confirmer les changements
                      </Button>
                      <Button
                        variant="secondary"
                        className="mr-4"
                        key="submit-reinitialiser-indicateur-top"
                        onClick={reinitialiserIndicateur}
                        type="button"
                      >
                        Annuler
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="primary"
                      className="mr-4"
                      key="passer-en-modification"
                      onClick={() =>
                        setEstEnCoursDeModification(!estEnCoursDeModification)
                      }
                      type="button"
                    >
                      Modifier
                    </Button>
                  )}
                </div>
              </Bloc>
            </form>
          </FormProvider>
        </div>
      </main>
    </div>
  );
};

export default PageIndicateur;
