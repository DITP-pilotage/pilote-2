import { FunctionComponent } from "react";
import Titre from "@/components/_commons/Titre/Titre";
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
      <Titre baliseHtml="h2" className="fr-h5">
        Pondération de l'indicateur dans le calcul du taux d'avancement global
      </Titre>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            disabled={!indicateurEstTerritorialise}
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            label={mapInfo.poids_pourcent_dept_declaree.metaPiloteAlias}
            name="poidsPourcentDept"
            valeurAffichee={computeValeurAffichee(
              mapInfo.poids_pourcent_dept_declaree,
              indicateur,
              "poidsPourcentDept",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            disabled={!indicateurEstTerritorialise}
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            label={mapInfo.poids_pourcent_reg_declaree.metaPiloteAlias}
            name="poidsPourcentReg"
            valeurAffichee={computeValeurAffichee(
              mapInfo.poids_pourcent_reg_declaree,
              indicateur,
              "poidsPourcentReg",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            label={mapInfo.poids_pourcent_nat_declaree.metaPiloteAlias}
            name="poidsPourcentNat"
            valeurAffichee={computeValeurAffichee(
              mapInfo.poids_pourcent_nat_declaree,
              indicateur,
              "poidsPourcentNat",
            )}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            label={mapInfo.poids_pourcent_eval_dept_declaree.metaPiloteAlias}
            name="poidsPourcentEvalDept"
            valeurAffichee={computeValeurAffichee(
              mapInfo.poids_pourcent_eval_dept_declaree,
              indicateur,
              "poidsPourcentEvalDept",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            label={mapInfo.poids_pourcent_eval_reg_declaree.metaPiloteAlias}
            name="poidsPourcentEvalReg"
            valeurAffichee={computeValeurAffichee(
              mapInfo.poids_pourcent_eval_reg_declaree,
              indicateur,
              "poidsPourcentEvalReg",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            editBoxType="text"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            label={mapInfo.poids_pourcent_eval_nat_declaree.metaPiloteAlias}
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
