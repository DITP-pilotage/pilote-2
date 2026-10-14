import { FunctionComponent } from "react";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { MapInformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import { MetadataChamp } from "@/components/_commons/MetadataChamp/MetadataChamp";
import { useMetadataIndicateurForm } from "@/components/PageIndicateur/useMetadataIndicateurForm";
import { computeValeurAffichee } from "@/components/PageIndicateur/FicheIndicateur/commons/utils";

const SectionDétailsMetadataParametrePonderationIndicateur: FunctionComponent<{
  indicateur: MetadataParametrageIndicateurContrat;
  estEnCoursDeModification: boolean;
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat;
}> = ({
  indicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur: mapInfo,
}) => {
  const form = useMetadataIndicateurForm();
  const indicateurEstTerritorialise = form.watch("indicTerritorialise");

  return (
    <div>
      <h2 className="text-h5 md:text-h5-md">
        Pondération de l'indicateur dans le calcul du taux d'avancement global
      </h2>
      <div className="flex flex-wrap -m-2 lg:-m-3">
        <div className="p-2 lg:p-3 w-full shrink-0 md:w-1/3">
          <MetadataChamp
            disabled={!indicateurEstTerritorialise}
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.poids_pourcent_dept_declaree}
            name="poidsPourcentDept"
            valeurAffichee={computeValeurAffichee(
              mapInfo.poids_pourcent_dept_declaree,
              indicateur,
              "poidsPourcentDept",
            )}
          />
        </div>
        <div className="p-2 lg:p-3 w-full shrink-0 md:w-1/3">
          <MetadataChamp
            disabled={!indicateurEstTerritorialise}
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.poids_pourcent_reg_declaree}
            name="poidsPourcentReg"
            valeurAffichee={computeValeurAffichee(
              mapInfo.poids_pourcent_reg_declaree,
              indicateur,
              "poidsPourcentReg",
            )}
          />
        </div>
        <div className="p-2 lg:p-3 w-full shrink-0 md:w-1/3">
          <MetadataChamp
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.poids_pourcent_nat_declaree}
            name="poidsPourcentNat"
            valeurAffichee={computeValeurAffichee(
              mapInfo.poids_pourcent_nat_declaree,
              indicateur,
              "poidsPourcentNat",
            )}
          />
        </div>
      </div>
      <div className="flex flex-wrap -m-2 lg:-m-3">
        <div className="p-2 lg:p-3 w-full shrink-0 md:w-1/3">
          <MetadataChamp
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.poids_pourcent_eval_dept_declaree}
            name="poidsPourcentEvalDept"
            valeurAffichee={computeValeurAffichee(
              mapInfo.poids_pourcent_eval_dept_declaree,
              indicateur,
              "poidsPourcentEvalDept",
            )}
          />
        </div>
        <div className="p-2 lg:p-3 w-full shrink-0 md:w-1/3">
          <MetadataChamp
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.poids_pourcent_eval_reg_declaree}
            name="poidsPourcentEvalReg"
            valeurAffichee={computeValeurAffichee(
              mapInfo.poids_pourcent_eval_reg_declaree,
              indicateur,
              "poidsPourcentEvalReg",
            )}
          />
        </div>
        <div className="p-2 lg:p-3 w-full shrink-0 md:w-1/3">
          <MetadataChamp
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.poids_pourcent_eval_nat_declaree}
            name="poidsPourcentEvalNat"
            valeurAffichee={computeValeurAffichee(
              mapInfo.poids_pourcent_eval_nat_declaree,
              indicateur,
              "poidsPourcentEvalNat",
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default SectionDétailsMetadataParametrePonderationIndicateur;
