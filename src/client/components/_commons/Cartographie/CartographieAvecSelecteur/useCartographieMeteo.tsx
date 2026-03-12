import { useMemo } from "react";
import { libellesMeteos } from "@/server/domain/météo/Météo.interface";
import { CartographieÉlémentsDeLégende } from "@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface";
import { CartographieDonnées } from "@/client/components/_commons/Cartographie/Cartographie.interface";
import { objectEntries } from "@/client/utils/objects/objects";
import { TerritoiresDonnées } from "@/server/domain/territoire/Territoire.interface";
import { Maille } from "@/server/domain/maille/Maille.interface";
import { useTerritoireHabilitation } from "@/client/hooks/useTerritoireHabilitation";
import { determinerRemplissageMeteo } from "@/client/utils/meteo/determinerRemplissageMeteo";

export const useCartographieMeteo = (
  chantierMailles: Record<Maille, TerritoiresDonnées>,
  elementsDeLegende: CartographieÉlémentsDeLégende,
) => {
  const { récupérerDétailsSurUnTerritoire } = useTerritoireHabilitation();

  const useRecupererDonnees = () => {
    const donnees = objectEntries({
      ...chantierMailles.departementale,
      ...chantierMailles.regionale,
    }).map(([territoireCodeDonnee, territoire]) => ({
      valeur: territoire.météo,
      territoireCode: territoireCodeDonnee as string,
      estApplicable: territoire.estApplicable,
    }));

    const legende = useMemo(() => {
      const tousApplicables: Boolean = donnees.every((d) => d.estApplicable);
      const tousNonNull: Boolean = donnees.every(
        (d) => d.valeur !== "NON_RENSEIGNEE",
      );

      let legendeAffichee = Object.values(elementsDeLegende);
      if (tousApplicables) {
        legendeAffichee = legendeAffichee.filter(
          (el) =>
            el.libellé !==
            "Territoire où le chantier prioritaire ne s'applique pas",
        );
      }

      if (tousNonNull) {
        legendeAffichee = legendeAffichee.filter(
          (el) =>
            el.libellé !==
            "Territoire pour lequel la meteo n'est pas renseignée",
        );
      }

      legendeAffichee = legendeAffichee.map(({ remplissage, libellé }) => ({
        libellé,
        remplissage,
      }));

      return legendeAffichee;
    }, [donnees]);

    const donneesCartographie = donnees.reduce((acc, val) => {
      const territoireGeographique = récupérerDétailsSurUnTerritoire(
        val.territoireCode,
      );

      return {
        ...acc,
        [val.territoireCode]: {
          contenu: (
            <div className="fr-text--bold">
              {val.estApplicable === false
                ? "Non applicable"
                : libellesMeteos[val.valeur]}
            </div>
          ),
          remplissage: determinerRemplissageMeteo(
            val.valeur,
            elementsDeLegende,
            val.estApplicable,
          ),
          libellé: territoireGeographique.nomAffiché,
          estApplicable: val.estApplicable,
        },
      };
    }, {} as CartographieDonnées);

    return {
      legende,
      donneesCartographie,
    };
  };
  return {
    useRecupererDonnees,
  };
};
