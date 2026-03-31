import { FunctionComponent } from "react";
import Titre from "@/components/_commons/Titre/Titre";
import { MapInformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { MetadataChamp } from "@/components/_commons/MetadataChamp/MetadataChamp";
import { useMetadataIndicateurForm } from "@/components/PageIndicateur/useMetadataIndicateurForm";
import { MetadataIndicateurForm } from "@/components/PageIndicateur/usePageIndicateur";
import {
  computeValeurAffichee,
  computeListeValeur,
} from "@/components/PageIndicateur/FicheIndicateur/commons/utils";

type ValeurDeptFrom = Pick<
  MetadataIndicateurForm,
  | "viDeptFrom"
  | "viDeptOp"
  | "vaDeptFrom"
  | "vaDeptOp"
  | "vcDeptFrom"
  | "vcDeptOp"
>;

const SectionDétailsMetadataParametreIndicateurDepartementale: FunctionComponent<{
  indicateur: MetadataParametrageIndicateurContrat;
  estEnCoursDeModification: boolean;
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat;
}> = ({
  indicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur: mapInfo,
}) => {
  const form = useMetadataIndicateurForm();

  const viDeptFromValue = form.watch("viDeptFrom");
  const vaDeptFromValue = form.watch("vaDeptFrom");
  const vcDeptFromValue = form.watch("vcDeptFrom");

  const valeursDeptFromDesactiveDeptOp = new Set(["_", "user_input"]);
  const ALaModificationValeurDeptFrom = (
    variableFrom: keyof ValeurDeptFrom,
    valeurFrom: string,
    variableOp: keyof ValeurDeptFrom,
    variableParDefautOp: string,
  ) => {
    form.setValue(variableFrom, valeurFrom);
    if (valeursDeptFromDesactiveDeptOp.has(valeurFrom)) {
      form.setValue(variableOp, variableParDefautOp);
    }
  };

  return (
    <div>
      <Titre baliseHtml="h2" className="fr-h5">
        Maille départementale
      </Titre>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            editBoxType="multi-select"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.vi_dept_from}
            listeValeur={computeListeValeur(mapInfo.vi_dept_from)}
            name="viDeptFrom"
            onChangeSideEffect={(valeur) => {
              ALaModificationValeurDeptFrom(
                "viDeptFrom",
                valeur,
                "viDeptOp",
                mapInfo.vi_dept_from.metaPiloteDefaultValue as string,
              );
            }}
            valeurAffichee={computeValeurAffichee(
              mapInfo.vi_dept_from,
              indicateur,
              "viDeptFrom",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            editBoxType="multi-select"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.va_dept_from}
            listeValeur={computeListeValeur(mapInfo.va_dept_from)}
            name="vaDeptFrom"
            onChangeSideEffect={(valeur) => {
              ALaModificationValeurDeptFrom(
                "vaDeptFrom",
                valeur,
                "vaDeptOp",
                mapInfo.va_dept_from.metaPiloteDefaultValue as string,
              );
            }}
            valeurAffichee={computeValeurAffichee(
              mapInfo.va_dept_from,
              indicateur,
              "vaDeptFrom",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            editBoxType="multi-select"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.vc_dept_from}
            listeValeur={computeListeValeur(mapInfo.vc_dept_from)}
            name="vcDeptFrom"
            onChangeSideEffect={(valeur) => {
              ALaModificationValeurDeptFrom(
                "vcDeptFrom",
                valeur,
                "vcDeptOp",
                mapInfo.vc_dept_from.metaPiloteDefaultValue as string,
              );
            }}
            valeurAffichee={computeValeurAffichee(
              mapInfo.vc_dept_from,
              indicateur,
              "vcDeptFrom",
            )}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            editBoxType="multi-select"
            estDesactive={valeursDeptFromDesactiveDeptOp.has(viDeptFromValue)}
            estEnCoursDeModification={estEnCoursDeModification}
            estMandatory={!valeursDeptFromDesactiveDeptOp.has(viDeptFromValue)}
            form={form}
            informationMetadata={mapInfo.vi_dept_op}
            listeValeur={computeListeValeur(mapInfo.vi_dept_op)}
            name="viDeptOp"
            valeurAffichee={computeValeurAffichee(
              mapInfo.vi_dept_op,
              indicateur,
              "viDeptOp",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            editBoxType="multi-select"
            estDesactive={valeursDeptFromDesactiveDeptOp.has(vaDeptFromValue)}
            estEnCoursDeModification={estEnCoursDeModification}
            estMandatory={!valeursDeptFromDesactiveDeptOp.has(vaDeptFromValue)}
            form={form}
            informationMetadata={mapInfo.va_dept_op}
            listeValeur={computeListeValeur(mapInfo.va_dept_op)}
            name="vaDeptOp"
            valeurAffichee={computeValeurAffichee(
              mapInfo.va_dept_op,
              indicateur,
              "vaDeptOp",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            editBoxType="multi-select"
            estDesactive={valeursDeptFromDesactiveDeptOp.has(vcDeptFromValue)}
            estEnCoursDeModification={estEnCoursDeModification}
            estMandatory={!valeursDeptFromDesactiveDeptOp.has(vcDeptFromValue)}
            form={form}
            informationMetadata={mapInfo.vc_dept_op}
            listeValeur={computeListeValeur(mapInfo.vc_dept_op)}
            name="vcDeptOp"
            valeurAffichee={computeValeurAffichee(
              mapInfo.vc_dept_op,
              indicateur,
              "vcDeptOp",
            )}
          />
        </div>
      </div>
      <hr className="fr-hr fr-mt-3w" />
    </div>
  );
};

export default SectionDétailsMetadataParametreIndicateurDepartementale;
