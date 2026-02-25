import "@gouvfr/dsfr/dist/component/table/table.min.css";
import { FunctionComponent } from "react";
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
import "@gouvfr/dsfr/dist/component/accordion/accordion.min.css";

const FicheIndicateur: FunctionComponent<FicheIndicateurProps> = ({
  indicateur,
  informationHistorisationIndicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur,
  chantiers,
}) => {
  return (
    <div>
      <SectionSelectionIndicateur
        estEnCoursDeModification={estEnCoursDeModification}
      />
      <SectionTableauIndicateur
        indicateur={indicateur}
        informationHistorisationIndicateur={informationHistorisationIndicateur}
      />
      <section className="fr-accordion">
        <h2 className="fr-accordion__title">
          <button
            aria-controls="accordion-identity"
            aria-expanded="true"
            className="fr-accordion__btn"
            type="button"
          >
            Identité indicateur
          </button>
        </h2>
        <div className="fr-collapse" id="accordion-identity">
          <SectionDétailsMetadataIndicateur
            chantiers={chantiers}
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            mapInformationMetadataIndicateur={mapInformationMetadataIndicateur}
          />
        </div>
      </section>
      <section className="fr-accordion">
        <h2 className="fr-accordion__title">
          <button
            aria-controls="accordion-parametrage"
            aria-expanded="false"
            className="fr-accordion__btn"
            type="button"
          >
            Paramétrages
          </button>
        </h2>
        <div className="fr-collapse" id="accordion-parametrage">
          <SectionDétailsMetadataParametreIndicateurDepartementale
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            mapInformationMetadataIndicateur={mapInformationMetadataIndicateur}
          />
          <SectionDétailsMetadataParametreIndicateurRegionale
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            mapInformationMetadataIndicateur={mapInformationMetadataIndicateur}
          />
          <SectionDétailsMetadataParametreIndicateurNationale
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            mapInformationMetadataIndicateur={mapInformationMetadataIndicateur}
          />
          <SectionDétailsMetadataParametreCalculIndicateur
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            mapInformationMetadataIndicateur={mapInformationMetadataIndicateur}
          />
          <SectionDétailsMetadataParametrePonderationIndicateur
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            mapInformationMetadataIndicateur={mapInformationMetadataIndicateur}
          />
        </div>
      </section>
      <section className="fr-accordion">
        <h2 className="fr-accordion__title">
          <button
            aria-controls="accordion-autres-informations"
            aria-expanded="false"
            className="fr-accordion__btn"
            type="button"
          >
            Autres informations
          </button>
        </h2>
        <div className="fr-collapse" id="accordion-autres-informations">
          <SectionDétailsMetadataAutresIndicateur
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            mapInformationMetadataIndicateur={mapInformationMetadataIndicateur}
          />
        </div>
      </section>
    </div>
  );
};

export default FicheIndicateur;
