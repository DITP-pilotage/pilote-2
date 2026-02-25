import { FunctionComponent } from "react";
import Titre from "@/components/_commons/Titre/Titre";
import { MapInformationMetadataIndicateurContrat } from "@/server/app/contrats/InformationMetadataContrat";
import { MetadataParametrageIndicateurContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import { MetadataSelecteur } from "@/components/PageIndicateur/FicheIndicateur/commons/MetadataSelecteur";
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
          <MetadataSelecteur
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
          <MetadataSelecteur
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
          <MetadataSelecteur
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
          <MetadataSelecteur
            estDesactive={valeursRegFromDesactiveRegOp.has(viRegFromValue)}
            estEnCoursDeModification={estEnCoursDeModification}
            estMandatory={!valeursRegFromDesactiveRegOp.has(viRegFromValue)}
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
          <MetadataSelecteur
            estDesactive={valeursRegFromDesactiveRegOp.has(vaRegFromValue)}
            estEnCoursDeModification={estEnCoursDeModification}
            estMandatory={!valeursRegFromDesactiveRegOp.has(vaRegFromValue)}
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
          <MetadataSelecteur
            estDesactive={valeursRegFromDesactiveRegOp.has(vcRegFromValue)}
            estEnCoursDeModification={estEnCoursDeModification}
            estMandatory={!valeursRegFromDesactiveRegOp.has(vcRegFromValue)}
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
