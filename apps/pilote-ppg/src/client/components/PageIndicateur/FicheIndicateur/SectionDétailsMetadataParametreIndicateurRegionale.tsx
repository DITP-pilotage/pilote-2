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

type ValeurRegFrom = Pick<
  MetadataIndicateurForm,
  "viRegFrom" | "viRegOp" | "vaRegFrom" | "vaRegOp" | "vcRegFrom" | "vcRegOp"
>;

const SectionDétailsMetadataParametreIndicateurRegionale: FunctionComponent<{
  indicateur: MetadataParametrageIndicateurContrat;
  estEnCoursDeModification: boolean;
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat;
}> = ({
  indicateur,
  estEnCoursDeModification,
  mapInformationMetadataIndicateur: mapInfo,
}) => {
  const form = useMetadataIndicateurForm();

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
          <MetadataChamp
            editBoxType="multi-select"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.vi_reg_from}
            listeValeur={computeListeValeur(mapInfo.vi_reg_from)}
            name="viRegFrom"
            onChangeSideEffect={(valeur) => {
              ALaModificationValeurRegFrom(
                "viRegFrom",
                valeur,
                "viRegOp",
                mapInfo.vi_reg_op.metaPiloteDefaultValue as string,
              );
            }}
            valeurAffichee={computeValeurAffichee(
              mapInfo.vi_reg_from,
              indicateur,
              "viRegFrom",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            editBoxType="multi-select"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.va_reg_from}
            listeValeur={computeListeValeur(mapInfo.va_reg_from)}
            name="vaRegFrom"
            onChangeSideEffect={(valeur) => {
              ALaModificationValeurRegFrom(
                "vaRegFrom",
                valeur,
                "vaRegOp",
                mapInfo.va_reg_op.metaPiloteDefaultValue as string,
              );
            }}
            valeurAffichee={computeValeurAffichee(
              mapInfo.va_reg_from,
              indicateur,
              "vaRegFrom",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            editBoxType="multi-select"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            informationMetadata={mapInfo.vc_reg_from}
            listeValeur={computeListeValeur(mapInfo.vc_reg_from)}
            name="vcRegFrom"
            onChangeSideEffect={(valeur) => {
              ALaModificationValeurRegFrom(
                "vcRegFrom",
                valeur,
                "vcRegOp",
                mapInfo.vc_reg_op.metaPiloteDefaultValue as string,
              );
            }}
            valeurAffichee={computeValeurAffichee(
              mapInfo.vc_reg_from,
              indicateur,
              "vcRegFrom",
            )}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            editBoxType="multi-select"
            estDesactive={valeursRegFromDesactiveRegOp.has(viRegFromValue)}
            estEnCoursDeModification={estEnCoursDeModification}
            estMandatory={!valeursRegFromDesactiveRegOp.has(viRegFromValue)}
            form={form}
            informationMetadata={mapInfo.vi_reg_op}
            listeValeur={computeListeValeur(mapInfo.vi_reg_op)}
            name="viRegOp"
            valeurAffichee={computeValeurAffichee(
              mapInfo.vi_reg_op,
              indicateur,
              "viRegOp",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            editBoxType="multi-select"
            estDesactive={valeursRegFromDesactiveRegOp.has(vaRegFromValue)}
            estEnCoursDeModification={estEnCoursDeModification}
            estMandatory={!valeursRegFromDesactiveRegOp.has(vaRegFromValue)}
            form={form}
            informationMetadata={mapInfo.va_reg_op}
            listeValeur={computeListeValeur(mapInfo.va_reg_op)}
            name="vaRegOp"
            valeurAffichee={computeValeurAffichee(
              mapInfo.va_reg_op,
              indicateur,
              "vaRegOp",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            editBoxType="multi-select"
            estDesactive={valeursRegFromDesactiveRegOp.has(vcRegFromValue)}
            estEnCoursDeModification={estEnCoursDeModification}
            estMandatory={!valeursRegFromDesactiveRegOp.has(vcRegFromValue)}
            form={form}
            informationMetadata={mapInfo.vc_reg_op}
            listeValeur={computeListeValeur(mapInfo.vc_reg_op)}
            name="vcRegOp"
            valeurAffichee={computeValeurAffichee(
              mapInfo.vc_reg_op,
              indicateur,
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
