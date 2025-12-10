import { FunctionComponent } from "react";
import Titre from "@/components/_commons/Titre/Titre";
import { MapInformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { MetadataIndicateurSelecteur } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataIndicateurSelecteur";
import {
  mappingAcceptedValues,
  mappingDisplayAcceptedValues,
} from "@/components/PageIndicateur/FicheIndicateur/commons/utils";
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
  const { getValues, setValue } = useMetadataIndicateurForm();

  type ValeurRegFrom = Pick<
    MetadataIndicateurForm,
    "viRegFrom" | "viRegOp" | "vaRegFrom" | "vaRegOp" | "vcRegFrom" | "vcRegOp"
  >;

  const valeursRegFromDesactiveRegOp = new Set(["_", "user_input"]);
  const ALaModificationValeurRegFrom = (
    variableFrom: keyof ValeurRegFrom,
    valeurFrom: string,
    variableOp: keyof ValeurRegFrom,
    variableParDefautOp: string,
  ) => {
    setValue(variableFrom, valeurFrom);
    if (valeursRegFromDesactiveRegOp.has(valeurFrom)) {
      setValue(variableOp, variableParDefautOp);
    }
  };

  return (
    <div>
      <Titre baliseHtml="h2" className="fr-h5">
        Maille régionale
      </Titre>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurSelecteur
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.vi_reg_from
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "vi_reg_from",
            )}
            name="viRegFrom"
            onChangeSideEffect={(valeur) => {
              ALaModificationValeurRegFrom(
                "viRegFrom",
                valeur,
                "viRegOp",
                mapInformationMetadataIndicateur.vi_reg_op
                  .metaPiloteDefaultValue as string,
              );
            }}
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "vi_reg_from",
              "viRegFrom",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurSelecteur
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.va_reg_from
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "va_reg_from",
            )}
            name="vaRegFrom"
            onChangeSideEffect={(valeur) => {
              ALaModificationValeurRegFrom(
                "vaRegFrom",
                valeur,
                "vaRegOp",
                mapInformationMetadataIndicateur.va_reg_op
                  .metaPiloteDefaultValue as string,
              );
            }}
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "va_reg_from",
              "vaRegFrom",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurSelecteur
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.vc_reg_from
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "vc_reg_from",
            )}
            name="vcRegFrom"
            onChangeSideEffect={(valeur) => {
              ALaModificationValeurRegFrom(
                "vcRegFrom",
                valeur,
                "vcRegOp",
                mapInformationMetadataIndicateur.vc_reg_op
                  .metaPiloteDefaultValue as string,
              );
            }}
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "vc_reg_from",
              "vcRegFrom",
            )}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurSelecteur
            estDesactive={valeursRegFromDesactiveRegOp.has(
              getValues("viRegFrom"),
            )}
            estEnCoursDeModification={estEnCoursDeModification}
            estMandatory={
              !valeursRegFromDesactiveRegOp.has(getValues("viRegFrom"))
            }
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.vi_reg_op
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "vi_reg_op",
            )}
            name="viRegOp"
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "vi_reg_op",
              "viRegOp",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurSelecteur
            estDesactive={valeursRegFromDesactiveRegOp.has(
              getValues("vaRegFrom"),
            )}
            estEnCoursDeModification={estEnCoursDeModification}
            estMandatory={
              !valeursRegFromDesactiveRegOp.has(getValues("vaRegFrom"))
            }
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.va_reg_op
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "va_reg_op",
            )}
            name="vaRegOp"
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "va_reg_op",
              "vaRegOp",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurSelecteur
            estDesactive={valeursRegFromDesactiveRegOp.has(
              getValues("vcRegFrom"),
            )}
            estEnCoursDeModification={estEnCoursDeModification}
            estMandatory={
              !valeursRegFromDesactiveRegOp.has(getValues("vcRegFrom"))
            }
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.vc_reg_op
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "vc_reg_op",
            )}
            name="vcRegOp"
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "vc_reg_op",
              "vcRegOp",
            )}
          />
        </div>
      </div>
      <hr className="fr-hr fr-mt-3w" />
    </div>
  );
};

export default SectionDétailsMetadataParametreIndicateurRegionale;
