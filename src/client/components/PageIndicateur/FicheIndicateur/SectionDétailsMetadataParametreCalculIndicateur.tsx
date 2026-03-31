import { FunctionComponent } from "react";
import Titre from "@/components/_commons/Titre/Titre";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { MapInformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import { MetadataIndicateurChamp } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurChamp";
import { useMetadataIndicateurForm } from "@/components/PageIndicateur/useMetadataIndicateurForm";

const SectionDétailsMetadataParametreCalculIndicateur: FunctionComponent<{
  indicateur: MetadataParametrageIndicateurContrat;
  estEnCoursDeModification: boolean;
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat;
}> = ({
  indicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur,
}) => {
  const { setValue } = useMetadataIndicateurForm();

  return (
    <div>
      <Titre baliseHtml="h2" className="fr-h5">
        Calcul de la valeur d'avancement
      </Titre>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.param_vaca_decumul_from
            }
            name="paramVacaDecumulFrom"
            onChangeSideEffect={(valeur) => {
              setValue("paramVacgDecumulFrom", valeur as string);
              setValue("paramVacaDecumulFrom", valeur as string);
            }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.param_vaca_partition_date
            }
            name="paramVacaPartitionDate"
            onChangeSideEffect={(valeur) => {
              setValue("paramVacaPartitionDate", valeur as string);
              setValue("paramVacgPartitionDate", valeur as string);
              setValue("paramVacaOp", valeur === "_" ? "current_value" : "sum");
              setValue("paramVacgOp", valeur === "_" ? "current_value" : "sum");
            }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurChamp
            estDesactive
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.param_vaca_op
            }
            name="paramVacaOp"
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.param_vacg_decumul_from
            }
            name="paramVacgDecumulFrom"
            onChangeSideEffect={(valeur) => {
              setValue("paramVacgDecumulFrom", valeur as string);
              setValue("paramVacaDecumulFrom", valeur as string);
            }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.param_vacg_partition_date
            }
            name="paramVacgPartitionDate"
            onChangeSideEffect={(valeur) => {
              setValue("paramVacaPartitionDate", valeur as string);
              setValue("paramVacaOp", valeur === "_" ? "current_value" : "sum");
              setValue("paramVacgPartitionDate", valeur as string);
              setValue("paramVacgOp", valeur === "_" ? "current_value" : "sum");
            }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurChamp
            estDesactive
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.param_vacg_op
            }
            name="paramVacgOp"
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.tendance
            }
            name="tendance"
          />
        </div>
      </div>
      <hr className="fr-hr fr-mt-3w" />
    </div>
  );
};

export default SectionDétailsMetadataParametreCalculIndicateur;
