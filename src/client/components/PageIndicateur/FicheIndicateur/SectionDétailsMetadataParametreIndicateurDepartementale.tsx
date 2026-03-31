import { FunctionComponent } from "react";
import Titre from "@/components/_commons/Titre/Titre";
import { MapInformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { MetadataIndicateurChamp } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurChamp";
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
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.vi_dept_from
            }
            name="viDeptFrom"
            onChangeSideEffect={(valeur) => {
              ALaModificationValeurDeptFrom(
                "viDeptFrom",
                valeur as string,
                "viDeptOp",
                mapInformationMetadataIndicateur.vi_dept_from
                  .metaPiloteDefaultValue as string,
              );
            }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.va_dept_from
            }
            name="vaDeptFrom"
            onChangeSideEffect={(valeur) => {
              ALaModificationValeurDeptFrom(
                "vaDeptFrom",
                valeur as string,
                "vaDeptOp",
                mapInformationMetadataIndicateur.va_dept_from
                  .metaPiloteDefaultValue as string,
              );
            }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.vc_dept_from
            }
            name="vcDeptFrom"
            onChangeSideEffect={(valeur) => {
              ALaModificationValeurDeptFrom(
                "vcDeptFrom",
                valeur as string,
                "vcDeptOp",
                mapInformationMetadataIndicateur.vc_dept_from
                  .metaPiloteDefaultValue as string,
              );
            }}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurChamp
            estDesactive={valeursDeptFromDesactiveDeptOp.has(viDeptFromValue)}
            estEnCoursDeModification={estEnCoursDeModification}
            estMandatory={!valeursDeptFromDesactiveDeptOp.has(viDeptFromValue)}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.vi_dept_op
            }
            name="viDeptOp"
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurChamp
            estDesactive={valeursDeptFromDesactiveDeptOp.has(vaDeptFromValue)}
            estEnCoursDeModification={estEnCoursDeModification}
            estMandatory={!valeursDeptFromDesactiveDeptOp.has(vaDeptFromValue)}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.va_dept_op
            }
            name="vaDeptOp"
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurChamp
            estDesactive={valeursDeptFromDesactiveDeptOp.has(vcDeptFromValue)}
            estEnCoursDeModification={estEnCoursDeModification}
            estMandatory={!valeursDeptFromDesactiveDeptOp.has(vcDeptFromValue)}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.vc_dept_op
            }
            name="vcDeptOp"
          />
        </div>
      </div>
      <hr className="fr-hr fr-mt-3w" />
    </div>
  );
};

export default SectionDétailsMetadataParametreIndicateurDepartementale;
