import { FunctionComponent } from "react";
import Titre from "@/components/_commons/Titre/Titre";
import { MapInformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import { MetadataIndicateurSelecteur } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurSelecteur";
import {
  mappingAcceptedValues,
  mappingDisplayAcceptedValues,
} from "@/components/PageIndicateur/FicheIndicateur/commons/utils";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { useMetadataIndicateurForm } from "@/components/PageIndicateur/useMetadataIndicateurForm";
import { MetadataIndicateurForm } from "@/components/PageIndicateur/usePageIndicateur";

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
  mapInformationMetadataIndicateur,
}) => {
  const { getValues, setValue } = useMetadataIndicateurForm();

  const valeursDeptFromDesactiveDeptOp = new Set(["_", "user_input"]);
  const ALaModificationValeurDeptFrom = (
    variableFrom: keyof ValeurDeptFrom,
    valeurFrom: string,
    variableOp: keyof ValeurDeptFrom,
    variableParDefautOp: string,
  ) => {
    setValue(variableFrom, valeurFrom);
    if (valeursDeptFromDesactiveDeptOp.has(valeurFrom)) {
      setValue(variableOp, variableParDefautOp);
    }
  };

  return (
    <div>
      <Titre baliseHtml="h2" className="fr-h5">
        Maille départementale
      </Titre>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurSelecteur
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.vi_dept_from
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "vi_dept_from",
            )}
            name="viDeptFrom"
            onChangeSideEffect={(valeur) => {
              ALaModificationValeurDeptFrom(
                "viDeptFrom",
                valeur,
                "viDeptOp",
                mapInformationMetadataIndicateur.vi_dept_from
                  .metaPiloteDefaultValue as string,
              );
            }}
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "vi_dept_from",
              "viDeptFrom",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurSelecteur
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.va_dept_from
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "va_dept_from",
            )}
            name="vaDeptFrom"
            onChangeSideEffect={(valeur) => {
              ALaModificationValeurDeptFrom(
                "vaDeptFrom",
                valeur,
                "vaDeptOp",
                mapInformationMetadataIndicateur.va_dept_from
                  .metaPiloteDefaultValue as string,
              );
            }}
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "va_dept_from",
              "vaDeptFrom",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurSelecteur
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.vc_dept_from
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "vc_dept_from",
            )}
            name="vcDeptFrom"
            onChangeSideEffect={(valeur) => {
              ALaModificationValeurDeptFrom(
                "vcDeptFrom",
                valeur,
                "vcDeptOp",
                mapInformationMetadataIndicateur.vc_dept_from
                  .metaPiloteDefaultValue as string,
              );
            }}
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "vc_dept_from",
              "vcDeptFrom",
            )}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurSelecteur
            estDesactive={valeursDeptFromDesactiveDeptOp.has(
              getValues("viDeptFrom"),
            )}
            estEnCoursDeModification={estEnCoursDeModification}
            estMandatory={
              !valeursDeptFromDesactiveDeptOp.has(getValues("viDeptFrom"))
            }
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.vi_dept_op
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "vi_dept_op",
            )}
            name="viDeptOp"
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "vi_dept_op",
              "viDeptOp",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurSelecteur
            estDesactive={valeursDeptFromDesactiveDeptOp.has(
              getValues("vaDeptFrom"),
            )}
            estEnCoursDeModification={estEnCoursDeModification}
            estMandatory={
              !valeursDeptFromDesactiveDeptOp.has(getValues("vaDeptFrom"))
            }
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.va_dept_op
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "va_dept_op",
            )}
            name="vaDeptOp"
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "va_dept_op",
              "vaDeptOp",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurSelecteur
            estDesactive={valeursDeptFromDesactiveDeptOp.has(
              getValues("vcDeptFrom"),
            )}
            estEnCoursDeModification={estEnCoursDeModification}
            estMandatory={
              !valeursDeptFromDesactiveDeptOp.has(getValues("vcDeptFrom"))
            }
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.vc_dept_op
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "vc_dept_op",
            )}
            name="vcDeptOp"
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "vc_dept_op",
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
