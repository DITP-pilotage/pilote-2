import "@gouvfr/dsfr/dist/component/table/table.min.css";
import Link from "next/link";
import { FormProvider } from "react-hook-form";
import { FunctionComponent } from "react";
import FilAriane from "@/components/_commons/FilAriane/FilAriane";
import Titre from "@/components/_commons/Titre/Titre";
import Bloc from "@/components/_commons/Bloc/Bloc";
import PageIndicateurStyled from "@/components/PageIndicateur/PageIndicateur.styled";
import FicheIndicateur from "@/components/PageIndicateur/FicheIndicateur/FicheIndicateur";
import {
  MetadataIndicateurForm,
  usePageIndicateur,
} from "@/components/PageIndicateur/usePageIndicateur";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { MapInformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import { ChantierSynthétisé } from "@/server/domain/chantier/Chantier.interface";
import { InformationHistorisationMetadataIndicateurContrat } from "@/server/parametrage-indicateur/app/InformationDerniereModificationMetadataIndicateurContrat";
import { Icone } from "@/components/_commons/Icone";
import { ArrowLine3Icon } from "@/components/_commons/Icones/ArrowLine3Icon";

interface PageIndicateurProps {
  indicateur: MetadataParametrageIndicateurContrat;
  informationHistorisationIndicateur: InformationHistorisationMetadataIndicateurContrat;
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat;
  estUneCréation: boolean;
  chantiers: ChantierSynthétisé[];
}

const PageIndicateur: FunctionComponent<PageIndicateurProps> = ({
  indicateur,
  informationHistorisationIndicateur,
  mapInformationMetadataIndicateur,
  estUneCréation,
  chantiers,
}) => {
  const chemin = [
    { nom: "Gestion des indicateurs", lien: "/admin/indicateurs" },
  ];

  const {
    reactHookForm,
    modifierIndicateur,
    creerIndicateur,
    estEnCoursDeModification,
    setEstEnCoursDeModification,
    reinitialiserIndicateur,
  } = usePageIndicateur(indicateur, mapInformationMetadataIndicateur);

  return (
    <PageIndicateurStyled className="fr-pt-2w">
      <main className="fr-container">
        <FilAriane chemin={chemin} libelléPageCourante="Indicateur" />
        <div className="fiche-indicateur fr-pt-1w fr-pb-13w">
          <FormProvider {...reactHookForm}>
            <form
              method="post"
              onSubmit={reactHookForm.handleSubmit(
                (data: MetadataIndicateurForm) => {
                  if (estUneCréation) {
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
                  href="/admin/indicateurs"
                >
                  <Icone className="w-4 h-4" icone={ArrowLine3Icon} />
                  Retour
                </Link>
              </div>
              <Titre baliseHtml="h1" className="fr-h1 fr-mt-4w">
                Fiche de l'indicateur {indicateur.indicId}
                <div className="fr-grid-row fr-mt-4w">
                  {estUneCréation ? (
                    <button
                      className="fr-btn fr-mr-2w"
                      key="submit-creer-indicateur-top"
                      type="submit"
                    >
                      Créer l'indicateur
                    </button>
                  ) : estEnCoursDeModification ? (
                    <>
                      <button
                        className="fr-btn fr-mr-2w"
                        key="submit-modifier-indicateur-top"
                        type="submit"
                      >
                        Confirmer les changements
                      </button>
                      <button
                        className="fr-btn fr-btn--secondary fr-mr-2w"
                        key="submit-reinitialiser-indicateur-top"
                        onClick={reinitialiserIndicateur}
                        type="button"
                      >
                        Annuler
                      </button>
                    </>
                  ) : (
                    <button
                      className="fr-btn fr-mr-2w"
                      key="passer-en-modification"
                      onClick={() =>
                        setEstEnCoursDeModification(!estEnCoursDeModification)
                      }
                      type="button"
                    >
                      Modifier
                    </button>
                  )}
                </div>
              </Titre>
              <Bloc>
                <div className="fr-py-4w fr-px-10w">
                  <FicheIndicateur
                    chantiers={chantiers}
                    estEnCoursDeModification={
                      estUneCréation || estEnCoursDeModification
                    }
                    indicateur={indicateur}
                    informationHistorisationIndicateur={
                      informationHistorisationIndicateur
                    }
                    mapInformationMetadataIndicateur={
                      mapInformationMetadataIndicateur
                    }
                  />
                  {estUneCréation ? (
                    <button
                      className="fr-btn fr-mr-2w"
                      key="submit-creer-indicateur-top"
                      type="submit"
                    >
                      Créer l'indicateur
                    </button>
                  ) : estEnCoursDeModification ? (
                    <>
                      <button
                        className="fr-btn fr-mr-2w"
                        key="submit-modifier-indicateur-top"
                        type="submit"
                      >
                        Confirmer les changements
                      </button>
                      <button
                        className="fr-btn fr-btn--secondary fr-mr-2w"
                        key="submit-reinitialiser-indicateur-top"
                        onClick={reinitialiserIndicateur}
                        type="button"
                      >
                        Annuler
                      </button>
                    </>
                  ) : (
                    <button
                      className="fr-btn fr-mr-2w"
                      key="passer-en-modification"
                      onClick={() =>
                        setEstEnCoursDeModification(!estEnCoursDeModification)
                      }
                      type="button"
                    >
                      Modifier
                    </button>
                  )}
                </div>
              </Bloc>
            </form>
          </FormProvider>
        </div>
      </main>
    </PageIndicateurStyled>
  );
};

export default PageIndicateur;
