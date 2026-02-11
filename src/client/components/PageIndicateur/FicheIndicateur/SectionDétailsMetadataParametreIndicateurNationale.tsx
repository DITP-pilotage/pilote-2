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

type ValeurNatFrom = Pick<
  MetadataIndicateurForm,
  "viNatFrom" | "viNatOp" | "vaNatFrom" | "vaNatOp" | "vcNatFrom" | "vcNatOp"
>;

const SectionDétailsMetadataParametreIndicateurNationale: FunctionComponent<{
  indicateur: MetadataParametrageIndicateurContrat;
  estEnCoursDeModification: boolean;
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat;
}> = ({
  indicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur,
}) => {
  const form = useMetadataIndicateurForm();

  const viNatFromValue = form.watch("viNatFrom");
  const vaNatFromValue = form.watch("vaNatFrom");
  const vcNatFromValue = form.watch("vcNatFrom");

  const valeursNatFromDesactiveNatOp = new Set(["_", "user_input"]);
  const ALaModificationValeurNatFrom = (
    variableFrom: keyof ValeurNatFrom,
    valeurFrom: string,
    variableOp: keyof ValeurNatFrom,
    variableParDefautOp: string,
  ) => {
    form.setValue(variableFrom, valeurFrom);
    if (valeursNatFromDesactiveNatOp.has(valeurFrom)) {
      form.setValue(variableOp, variableParDefautOp);
    }
  };

  return (
    <div>
      <Titre baliseHtml="h2" className="fr-h5">
        Maille nationale
      </Titre>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurSelecteur
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.vi_nat_from
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "vi_nat_from",
            )}
            name="viNatFrom"
            onChangeSideEffect={(valeur) => {
              ALaModificationValeurNatFrom(
                "viNatFrom",
                valeur,
                "viNatOp",
                mapInformationMetadataIndicateur.vi_nat_op
                  .metaPiloteDefaultValue as string,
              );
            }}
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "vi_nat_from",
              "viNatFrom",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurSelecteur
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.va_nat_from
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "va_nat_from",
            )}
            name="vaNatFrom"
            onChangeSideEffect={(valeur) => {
              ALaModificationValeurNatFrom(
                "vaNatFrom",
                valeur,
                "vaNatOp",
                mapInformationMetadataIndicateur.va_nat_op
                  .metaPiloteDefaultValue as string,
              );
            }}
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "va_nat_from",
              "vaNatFrom",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurSelecteur
            estEnCoursDeModification={estEnCoursDeModification}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.vc_nat_from
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "vc_nat_from",
            )}
            name="vcNatFrom"
            onChangeSideEffect={(valeur) => {
              ALaModificationValeurNatFrom(
                "vcNatFrom",
                valeur,
                "vcNatOp",
                mapInformationMetadataIndicateur.va_nat_op
                  .metaPiloteDefaultValue as string,
              );
            }}
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "vc_nat_from",
              "vcNatFrom",
            )}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurSelecteur
            estDesactive={valeursNatFromDesactiveNatOp.has(viNatFromValue)}
            estEnCoursDeModification={estEnCoursDeModification}
            estMandatory={!valeursNatFromDesactiveNatOp.has(viNatFromValue)}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.vi_nat_op
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "vi_nat_op",
            )}
            name="viNatOp"
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "vi_nat_op",
              "viNatOp",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurSelecteur
            estDesactive={valeursNatFromDesactiveNatOp.has(vaNatFromValue)}
            estEnCoursDeModification={estEnCoursDeModification}
            estMandatory={!valeursNatFromDesactiveNatOp.has(vaNatFromValue)}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.va_nat_op
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "va_nat_op",
            )}
            name="vaNatOp"
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "va_nat_op",
              "vaNatOp",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataIndicateurSelecteur
            estDesactive={valeursNatFromDesactiveNatOp.has(vcNatFromValue)}
            estEnCoursDeModification={estEnCoursDeModification}
            estMandatory={!valeursNatFromDesactiveNatOp.has(vcNatFromValue)}
            informationMetadataIndicateur={
              mapInformationMetadataIndicateur.vc_nat_op
            }
            listeValeur={mappingAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "vc_nat_op",
            )}
            name="vcNatOp"
            valeurAffiché={mappingDisplayAcceptedValues(
              mapInformationMetadataIndicateur,
              indicateur,
              "vc_nat_op",
              "vcNatOp",
            )}
          />
        </div>
      </div>
      <hr className="fr-hr fr-mt-3w" />
    </div>
  );
};

export default SectionDétailsMetadataParametreIndicateurNationale;
