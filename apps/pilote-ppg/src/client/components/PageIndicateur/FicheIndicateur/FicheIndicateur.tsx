import { FunctionComponent } from "react";
import {
  Accordion,
  CLASSES_DECLENCHEUR_ACCORDEON_DSFR,
  CLASSES_ENTETE_ACCORDEON_DSFR,
  CLASSES_CONTENU_ACCORDEON_DSFR,
  CLASSES_INTERIEUR_ACCORDEON_DSFR,
  CLASSES_ITEM_ACCORDEON_DSFR,
} from "@/components/shared/Accordion";
import SectionTableauIndicateur from "@/components/PageIndicateur/FicheIndicateur/SectionTableauIndicateur";
import SectionDétailsMetadataIndicateur from "@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataIndicateur";
import SectionDétailsMetadataParametreCalculIndicateur from "@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreCalculIndicateur";
import SectionSelectionIndicateur from "@/components/PageIndicateur/FicheIndicateur/SectionSelectionIndicateur";
import SectionDétailsMetadataAutresIndicateur from "@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataAutresIndicateur";
import SectionDétailsMetadataParametreIndicateurDepartementale from "@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateurDepartementale";
import SectionDétailsMetadataParametreIndicateurRegionale from "@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateurRegionale";
import SectionDétailsMetadataParametreIndicateurNationale from "@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametreIndicateurNationale";
import SectionDétailsMetadataParametrePonderationIndicateur from "@/components/PageIndicateur/FicheIndicateur/SectionDétailsMetadataParametrePonderationIndicateur";
import FicheIndicateurProps from "./FicheIndicateur.interface";

const FicheIndicateur: FunctionComponent<FicheIndicateurProps> = ({
  indicateur,
  informationHistorisationIndicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur,
  chantiers,
}) => {
  return (
    <div>
      <div className="fr-mb-2w">
        <SectionSelectionIndicateur
          estEnCoursDeModification={estEnCoursDeModification}
        />
        <SectionTableauIndicateur
          indicateur={indicateur}
          informationHistorisationIndicateur={
            informationHistorisationIndicateur
          }
        />
        <Accordion.Root defaultValue={["accordion-identity"]} type="multiple">
          <Accordion.Item
            className={CLASSES_ITEM_ACCORDEON_DSFR}
            value="accordion-identity"
          >
            <Accordion.Header asChild className={CLASSES_ENTETE_ACCORDEON_DSFR}>
              <h2>
                <Accordion.Trigger
                  className={CLASSES_DECLENCHEUR_ACCORDEON_DSFR}
                >
                  Identité indicateur
                </Accordion.Trigger>
              </h2>
            </Accordion.Header>
            <Accordion.Content
              className={CLASSES_CONTENU_ACCORDEON_DSFR}
              innerClassName={CLASSES_INTERIEUR_ACCORDEON_DSFR}
            >
              <SectionDétailsMetadataIndicateur
                chantiers={chantiers}
                estEnCoursDeModification={estEnCoursDeModification}
                indicateur={indicateur}
                mapInformationMetadataIndicateur={
                  mapInformationMetadataIndicateur
                }
              />
            </Accordion.Content>
          </Accordion.Item>
          <Accordion.Item
            className={CLASSES_ITEM_ACCORDEON_DSFR}
            value="accordion-parametrage"
          >
            <Accordion.Header asChild className={CLASSES_ENTETE_ACCORDEON_DSFR}>
              <h2>
                <Accordion.Trigger
                  className={CLASSES_DECLENCHEUR_ACCORDEON_DSFR}
                >
                  Paramétrages
                </Accordion.Trigger>
              </h2>
            </Accordion.Header>
            <Accordion.Content
              className={CLASSES_CONTENU_ACCORDEON_DSFR}
              innerClassName={CLASSES_INTERIEUR_ACCORDEON_DSFR}
            >
              <SectionDétailsMetadataParametreIndicateurDepartementale
                estEnCoursDeModification={estEnCoursDeModification}
                indicateur={indicateur}
                mapInformationMetadataIndicateur={
                  mapInformationMetadataIndicateur
                }
              />
              <SectionDétailsMetadataParametreIndicateurRegionale
                estEnCoursDeModification={estEnCoursDeModification}
                indicateur={indicateur}
                mapInformationMetadataIndicateur={
                  mapInformationMetadataIndicateur
                }
              />
              <SectionDétailsMetadataParametreIndicateurNationale
                estEnCoursDeModification={estEnCoursDeModification}
                indicateur={indicateur}
                mapInformationMetadataIndicateur={
                  mapInformationMetadataIndicateur
                }
              />
              <SectionDétailsMetadataParametreCalculIndicateur
                estEnCoursDeModification={estEnCoursDeModification}
                indicateur={indicateur}
                mapInformationMetadataIndicateur={
                  mapInformationMetadataIndicateur
                }
              />
              <SectionDétailsMetadataParametrePonderationIndicateur
                estEnCoursDeModification={estEnCoursDeModification}
                indicateur={indicateur}
                mapInformationMetadataIndicateur={
                  mapInformationMetadataIndicateur
                }
              />
            </Accordion.Content>
          </Accordion.Item>
          <Accordion.Item
            className={CLASSES_ITEM_ACCORDEON_DSFR}
            value="accordion-autres-informations"
          >
            <Accordion.Header asChild className={CLASSES_ENTETE_ACCORDEON_DSFR}>
              <h2>
                <Accordion.Trigger
                  className={CLASSES_DECLENCHEUR_ACCORDEON_DSFR}
                >
                  Autres informations
                </Accordion.Trigger>
              </h2>
            </Accordion.Header>
            <Accordion.Content
              className={CLASSES_CONTENU_ACCORDEON_DSFR}
              innerClassName={CLASSES_INTERIEUR_ACCORDEON_DSFR}
            >
              <SectionDétailsMetadataAutresIndicateur
                estEnCoursDeModification={estEnCoursDeModification}
                indicateur={indicateur}
                mapInformationMetadataIndicateur={
                  mapInformationMetadataIndicateur
                }
              />
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>
      </div>
    </div>
  );
};

export default FicheIndicateur;
