import { FunctionComponent } from "react";
import Titre from "@/components/_commons/Titre/Titre";
import { MapInformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { MetadataIndicateurChamp } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurChamp";
import { useMetadataIndicateurForm } from "@/components/PageIndicateur/useMetadataIndicateurForm";
import { MetadataIndicateurForm } from "@/components/PageIndicateur/usePageIndicateur";

const SectionDétailsMetadataParametreIndicateurRegionale: FunctionComponent<{
  indicateur: MetadataParametrageIndicateurContrat;
  estEnCoursDeModification: boolean;
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat;
}> = ({
  indicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur,
}) => {
  const form = useMetadataIndicateurForm();

  type ValeurRegFrom = Pick<
    MetadataIndicateurForm,
    "viRegFrom" | "viRegOp" | "vaRegFrom" | "vaRegOp" | "vcRegFrom" | "vcRegOp"
  >;

  const valeursRegFromDesactiveRegOp = new Set(["_", "user_input"]);

  const viRegFromValue = form.watch("viRegFrom");
  const vaRegFromValue = form.watch("vaRegFrom");
  const vcRegFromValue = form.watch("vcRegFrom");

  const ALaModificationValeurRegFrom = (
    variableFrom: keyof ValeurRegFrom,
    valeurFrom: string,
    variableOp: keyof ValeurRegFrom,
    variableParDefautOp: string,
  ) => {
    form.setValue(variableFrom, valeurFrom);
    if (valeursRegFromDesactiveRegOp.has(valeurFrom)) {
      form.setValue(variableOp, variableParDefautOp);
    }
  };

  return (
    <div>
      <Titre baliseHtml="h2" className="fr-h5">
        Maille régionale
      </Titre>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurChamp
            estEnCoursDeModification={estEnCoursDeModification}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.vi_reg_from
            }
            name="viRegFrom"
            onChangeSideEffect={(valeur) => {
              ALaModificationValeurRegFrom(
                "viRegFrom",
                valeur as string,
                "viRegOp",
                mapInformationMetadataIndicateur.vi_reg_op
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
              mapInformationMetadataIndicateur.va_reg_from
            }
            name="vaRegFrom"
            onChangeSideEffect={(valeur) => {
              ALaModificationValeurRegFrom(
                "vaRegFrom",
                valeur as string,
                "vaRegOp",
                mapInformationMetadataIndicateur.va_reg_op
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
              mapInformationMetadataIndicateur.vc_reg_from
            }
            name="vcRegFrom"
            onChangeSideEffect={(valeur) => {
              ALaModificationValeurRegFrom(
                "vcRegFrom",
                valeur as string,
                "vcRegOp",
                mapInformationMetadataIndicateur.vc_reg_op
                  .metaPiloteDefaultValue as string,
              );
            }}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurChamp
            estDesactive={valeursRegFromDesactiveRegOp.has(viRegFromValue)}
            estEnCoursDeModification={estEnCoursDeModification}
            estMandatory={!valeursRegFromDesactiveRegOp.has(viRegFromValue)}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.vi_reg_op
            }
            name="viRegOp"
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurChamp
            estDesactive={valeursRegFromDesactiveRegOp.has(vaRegFromValue)}
            estEnCoursDeModification={estEnCoursDeModification}
            estMandatory={!valeursRegFromDesactiveRegOp.has(vaRegFromValue)}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.va_reg_op
            }
            name="vaRegOp"
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurChamp
            estDesactive={valeursRegFromDesactiveRegOp.has(vcRegFromValue)}
            estEnCoursDeModification={estEnCoursDeModification}
            estMandatory={!valeursRegFromDesactiveRegOp.has(vcRegFromValue)}
            indicateur={indicateur}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.vc_reg_op
            }
            name="vcRegOp"
          />
        </div>
      </div>
      <hr className="fr-hr fr-mt-3w" />
    </div>
  );
};

export default SectionDétailsMetadataParametreIndicateurRegionale;
