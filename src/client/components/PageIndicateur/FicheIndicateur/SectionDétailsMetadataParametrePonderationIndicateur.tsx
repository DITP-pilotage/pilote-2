import { FunctionComponent } from "react";
import Titre from "@/components/_commons/Titre/Titre";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { MapInformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import { MetadataIndicateurChamp } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurChamp";
import { useMetadataIndicateurForm } from "@/components/PageIndicateur/useMetadataIndicateurForm";

const SectionDétailsMetadataParametrePonderationIndicateur: FunctionComponent<{
  indicateur: MetadataParametrageIndicateurContrat;
  estEnCoursDeModification: boolean;
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat;
}> = ({
  indicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur,
}) => {
  const form = useMetadataIndicateurForm();
  const indicateurEstTerritorialise = form.watch("indicTerritorialise");

  return (
    <div>
      <Titre baliseHtml="h2" className="fr-h5">
        Pondération de l'indicateur dans le calcul du taux d'avancement global
      </Titre>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurChamp
            disabled={!indicateurEstTerritorialise}
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.poids_pourcent_dept_declaree
            }
            name="poidsPourcentDept"
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurChamp
            disabled={!indicateurEstTerritorialise}
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.poids_pourcent_reg_declaree
            }
            name="poidsPourcentReg"
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.poids_pourcent_nat_declaree
            }
            name="poidsPourcentNat"
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.poids_pourcent_eval_dept_declaree
            }
            name="poidsPourcentEvalDept"
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.poids_pourcent_eval_reg_declaree
            }
            name="poidsPourcentEvalReg"
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.poids_pourcent_eval_nat_declaree
            }
            name="poidsPourcentEvalNat"
          />
        </div>
      </div>
    </div>
  );
};

export default SectionDétailsMetadataParametrePonderationIndicateur;
