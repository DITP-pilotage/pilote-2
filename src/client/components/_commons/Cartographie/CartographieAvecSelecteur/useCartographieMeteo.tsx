import { useMemo } from "react";
import { libellésMétéos, Météo } from "@/server/domain/météo/Météo.interface";
import { CartographieÉlémentsDeLégende } from "@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface";
import { CartographieDonnées } from "@/client/components/_commons/Cartographie/Cartographie.interface";
import { objectEntries } from "@/client/utils/objects/objects";
import { TerritoiresDonnées } from "@/server/domain/territoire/Territoire.interface";
import { Maille } from "@/server/domain/maille/Maille.interface";
import { useTerritoireHabilitation } from "@/client/hooks/useTerritoireHabilitation";

const determinerRemplissage = (
  valeur: Météo | null,
  elementsDeLegende: CartographieÉlémentsDeLégende,
  estApplicable: boolean | null,
) => {
  if (estApplicable === false)
    return elementsDeLegende.NON_APPLICABLE.remplissage;
  else if (valeur === "ORAGE") return elementsDeLegende.ORAGE.remplissage;
  else if (valeur === "COUVERT") return elementsDeLegende.COUVERT.remplissage;
  else if (valeur === "NUAGE") return elementsDeLegende.NUAGE.remplissage;
  else if (valeur === "SOLEIL") return elementsDeLegende.SOLEIL.remplissage;
  else return elementsDeLegende.DÉFAUT.remplissage;
};

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
                : libellésMétéos[val.valeur]}
            </div>
          ),
          remplissage: determinerRemplissage(
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
