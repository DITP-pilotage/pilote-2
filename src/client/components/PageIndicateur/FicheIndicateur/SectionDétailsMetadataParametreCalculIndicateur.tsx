import { FunctionComponent } from "react";
import Titre from "@/components/_commons/Titre/Titre";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { MapInformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import { MetadataIndicateurSelecteur } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurSelecteur";
import {
  mappingAcceptedValues,
  mappingDisplayAcceptedValues,
} from "@/components/PageIndicateur/FicheIndicateur/commons/utils";
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
          <MetadataIndicateurSelecteur
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.param_vaca_decumul_from
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "param_vaca_decumul_from",
            )}
            name="paramVacaDecumulFrom"
            onChangeSideEffect={(valeur) => {
              setValue("paramVacgDecumulFrom", valeur);
              setValue("paramVacaDecumulFrom", valeur);
            }}
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "param_vaca_decumul_from",
              "paramVacaDecumulFrom",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurSelecteur
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.param_vaca_partition_date
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "param_vaca_partition_date",
            )}
            name="paramVacaPartitionDate"
            onChangeSideEffect={(valeur) => {
              setValue("paramVacaPartitionDate", valeur);
              setValue("paramVacgPartitionDate", valeur);
              setValue("paramVacaOp", valeur === "_" ? "current_value" : "sum");
              setValue("paramVacgOp", valeur === "_" ? "current_value" : "sum");
            }}
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "param_vaca_partition_date",
              "paramVacaPartitionDate",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurSelecteur
            estDesactive
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.param_vaca_op
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "param_vaca_op",
            )}
            name="paramVacaOp"
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "param_vaca_op",
              "paramVacaOp",
            )}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurSelecteur
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.param_vacg_decumul_from
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "param_vacg_decumul_from",
            )}
            name="paramVacgDecumulFrom"
            onChangeSideEffect={(valeur) => {
              setValue("paramVacgDecumulFrom", valeur);
              setValue("paramVacaDecumulFrom", valeur);
            }}
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "param_vacg_decumul_from",
              "paramVacgDecumulFrom",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurSelecteur
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.param_vacg_partition_date
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "param_vacg_partition_date",
            )}
            name="paramVacgPartitionDate"
            onChangeSideEffect={(valeur) => {
              setValue("paramVacaPartitionDate", valeur);
              setValue("paramVacaOp", valeur === "_" ? "current_value" : "sum");
              setValue("paramVacgPartitionDate", valeur);
              setValue("paramVacgOp", valeur === "_" ? "current_value" : "sum");
            }}
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "param_vacg_partition_date",
              "paramVacgPartitionDate",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurSelecteur
            estDesactive
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.param_vacg_op
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "param_vacg_op",
            )}
            name="paramVacgOp"
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "param_vacg_op",
              "paramVacgOp",
            )}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurSelecteur
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.tendance
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "tendance",
            )}
            name="tendance"
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "tendance",
              "tendance",
            )}
          />
        </div>
      </div>
      <hr className="fr-hr fr-mt-3w" />
    </div>
  );
};

export default SectionDétailsMetadataParametreCalculIndicateur;
