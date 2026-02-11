import { FunctionComponent } from "react";
import Titre from "@/components/_commons/Titre/Titre";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { MapInformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import { MetadataIndicateurInput } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurInput";
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
          <MetadataIndicateurInput
            disabled={!indicateurEstTerritorialise}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="poidsPourcentDept"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.poids_pourcent_dept_declaree
            }
            valeurAffiché={`${indicateur.poidsPourcentDept}`}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurInput
            disabled={!indicateurEstTerritorialise}
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="poidsPourcentReg"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.poids_pourcent_reg_declaree
            }
            valeurAffiché={`${indicateur.poidsPourcentReg}`}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurInput
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="poidsPourcentNat"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.poids_pourcent_nat_declaree
            }
            valeurAffiché={`${indicateur.poidsPourcentNat}`}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurInput
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="poidsPourcentEvalDept"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.poids_pourcent_eval_dept_declaree
            }
            valeurAffiché={`${indicateur.poidsPourcentEvalDept}`}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurInput
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="poidsPourcentEvalReg"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.poids_pourcent_eval_reg_declaree
            }
            valeurAffiché={`${indicateur.poidsPourcentEvalReg}`}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurInput
            estEnCoursDeModification={estEnCoursDeModification}
            htmlName="poidsPourcentEvalNat"
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.poids_pourcent_eval_nat_declaree
            }
            valeurAffiché={`${indicateur.poidsPourcentEvalNat}`}
          />
        </div>
      </div>
    </div>
  );
};

export default SectionDétailsMetadataParametrePonderationIndicateur;
