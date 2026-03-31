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
  mapInformationMetadataIndicateur: mapInfo,
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
          <MetadataChamp
            editBoxType="multi-select"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            label={mapInfo.vi_nat_from.metaPiloteAlias}
            listeValeur={computeListeValeur(mapInfo.vi_nat_from)}
            name="viNatFrom"
            onChangeSideEffect={(valeur) => {
              ALaModificationValeurNatFrom(
                "viNatFrom",
                valeur,
                "viNatOp",
                mapInfo.vi_nat_op.metaPiloteDefaultValue as string,
              );
            }}
            valeurAffichee={computeValeurAffichee(
              mapInfo.vi_nat_from,
              indicateur,
              "viNatFrom",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            editBoxType="multi-select"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            label={mapInfo.va_nat_from.metaPiloteAlias}
            listeValeur={computeListeValeur(mapInfo.va_nat_from)}
            name="vaNatFrom"
            onChangeSideEffect={(valeur) => {
              ALaModificationValeurNatFrom(
                "vaNatFrom",
                valeur,
                "vaNatOp",
                mapInfo.va_nat_op.metaPiloteDefaultValue as string,
              );
            }}
            valeurAffichee={computeValeurAffichee(
              mapInfo.va_nat_from,
              indicateur,
              "vaNatFrom",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            editBoxType="multi-select"
            estEnCoursDeModification={estEnCoursDeModification}
            form={form}
            label={mapInfo.vc_nat_from.metaPiloteAlias}
            listeValeur={computeListeValeur(mapInfo.vc_nat_from)}
            name="vcNatFrom"
            onChangeSideEffect={(valeur) => {
              ALaModificationValeurNatFrom(
                "vcNatFrom",
                valeur,
                "vcNatOp",
                mapInfo.va_nat_op.metaPiloteDefaultValue as string,
              );
            }}
            valeurAffichee={computeValeurAffichee(
              mapInfo.vc_nat_from,
              indicateur,
              "vcNatFrom",
            )}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            editBoxType="multi-select"
            estDesactive={valeursNatFromDesactiveNatOp.has(viNatFromValue)}
            estEnCoursDeModification={estEnCoursDeModification}
            estMandatory={!valeursNatFromDesactiveNatOp.has(viNatFromValue)}
            form={form}
            label={mapInfo.vi_nat_op.metaPiloteAlias}
            listeValeur={computeListeValeur(mapInfo.vi_nat_op)}
            name="viNatOp"
            valeurAffichee={computeValeurAffichee(
              mapInfo.vi_nat_op,
              indicateur,
              "viNatOp",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            editBoxType="multi-select"
            estDesactive={valeursNatFromDesactiveNatOp.has(vaNatFromValue)}
            estEnCoursDeModification={estEnCoursDeModification}
            estMandatory={!valeursNatFromDesactiveNatOp.has(vaNatFromValue)}
            form={form}
            label={mapInfo.va_nat_op.metaPiloteAlias}
            listeValeur={computeListeValeur(mapInfo.va_nat_op)}
            name="vaNatOp"
            valeurAffichee={computeValeurAffichee(
              mapInfo.va_nat_op,
              indicateur,
              "vaNatOp",
            )}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <MetadataChamp
            editBoxType="multi-select"
            estDesactive={valeursNatFromDesactiveNatOp.has(vcNatFromValue)}
            estEnCoursDeModification={estEnCoursDeModification}
            estMandatory={!valeursNatFromDesactiveNatOp.has(vcNatFromValue)}
            form={form}
            label={mapInfo.vc_nat_op.metaPiloteAlias}
            listeValeur={computeListeValeur(mapInfo.vc_nat_op)}
            name="vcNatOp"
            valeurAffichee={computeValeurAffichee(
              mapInfo.vc_nat_op,
              indicateur,
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
