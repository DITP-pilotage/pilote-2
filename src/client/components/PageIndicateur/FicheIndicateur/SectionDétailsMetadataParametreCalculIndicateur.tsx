import { FunctionComponent } from "react";
import Titre from "@/components/_commons/Titre/Titre";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { MapInformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import { MetadataChamp } from "@/components/_commons/MetadataChamp/MetadataChamp";
import { useMetadataIndicateurForm } from "@/components/PageIndicateur/useMetadataIndicateurForm";
import {
  computeValeurAffichee,
  computeListeValeur,
} from "@/components/PageIndicateur/FicheIndicateur/commons/utils";

const SectionDétailsMetadataParametreCalculIndicateur: FunctionComponent<{
  indicateur: MetadataParametrageIndicateurContrat;
  estEnCoursDeModification: boolean;
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat;
}> = ({
  indicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur: mapInfo,
}) => {
  const form = useMetadataIndicateurForm();

  return (
    <div>
      <Titre baliseHtml="h2" className="fr-h5">
        Calcul de la valeur d'avancement
      </Titre>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            editBoxType="multi-select"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.param_vaca_decumul_from}
            listeValeur={computeListeValeur(mapInfo.param_vaca_decumul_from)}
            name="paramVacaDecumulFrom"
            onChangeSideEffect={(valeur) => {
              form.setValue("paramVacgDecumulFrom", valeur);
              form.setValue("paramVacaDecumulFrom", valeur);
            }}
            valeurAffichee={computeValeurAffichee(
              mapInfo.param_vaca_decumul_from,
              indicateur,
              "paramVacaDecumulFrom",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            editBoxType="multi-select"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.param_vaca_partition_date}
            listeValeur={computeListeValeur(mapInfo.param_vaca_partition_date)}
            name="paramVacaPartitionDate"
            onChangeSideEffect={(valeur) => {
              form.setValue("paramVacaPartitionDate", valeur);
              form.setValue("paramVacgPartitionDate", valeur);
              form.setValue(
                "paramVacaOp",
                valeur === "_" ? "current_value" : "sum",
              );
              form.setValue(
                "paramVacgOp",
                valeur === "_" ? "current_value" : "sum",
              );
            }}
            valeurAffichee={computeValeurAffichee(
              mapInfo.param_vaca_partition_date,
              indicateur,
              "paramVacaPartitionDate",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            editBoxType="multi-select"
            estDesactive
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.param_vaca_op}
            listeValeur={computeListeValeur(mapInfo.param_vaca_op)}
            name="paramVacaOp"
            valeurAffichee={computeValeurAffichee(
              mapInfo.param_vaca_op,
              indicateur,
              "paramVacaOp",
            )}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            editBoxType="multi-select"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.param_vacg_decumul_from}
            listeValeur={computeListeValeur(mapInfo.param_vacg_decumul_from)}
            name="paramVacgDecumulFrom"
            onChangeSideEffect={(valeur) => {
              form.setValue("paramVacgDecumulFrom", valeur);
              form.setValue("paramVacaDecumulFrom", valeur);
            }}
            valeurAffichee={computeValeurAffichee(
              mapInfo.param_vacg_decumul_from,
              indicateur,
              "paramVacgDecumulFrom",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            editBoxType="multi-select"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.param_vacg_partition_date}
            listeValeur={computeListeValeur(mapInfo.param_vacg_partition_date)}
            name="paramVacgPartitionDate"
            onChangeSideEffect={(valeur) => {
              form.setValue("paramVacaPartitionDate", valeur);
              form.setValue(
                "paramVacaOp",
                valeur === "_" ? "current_value" : "sum",
              );
              form.setValue("paramVacgPartitionDate", valeur);
              form.setValue(
                "paramVacgOp",
                valeur === "_" ? "current_value" : "sum",
              );
            }}
            valeurAffichee={computeValeurAffichee(
              mapInfo.param_vacg_partition_date,
              indicateur,
              "paramVacgPartitionDate",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            editBoxType="multi-select"
            estDesactive
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.param_vacg_op}
            listeValeur={computeListeValeur(mapInfo.param_vacg_op)}
            name="paramVacgOp"
            valeurAffichee={computeValeurAffichee(
              mapInfo.param_vacg_op,
              indicateur,
              "paramVacgOp",
            )}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            editBoxType="multi-select"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.tendance}
            listeValeur={computeListeValeur(mapInfo.tendance)}
            name="tendance"
            valeurAffichee={computeValeurAffichee(
              mapInfo.tendance,
              indicateur,
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
