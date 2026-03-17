import { useMemo } from "react";
import { CartographieÉlémentsDeLégende } from "@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface";
import { CartographieDonnées } from "@/client/components/_commons/Cartographie/Cartographie.interface";
import { objectEntries } from "@/client/utils/objects/objects";
import { TerritoiresDonnées } from "@/server/domain/territoire/Territoire.interface";
import { Maille } from "@/server/domain/maille/Maille.interface";
import { useTerritoireHabilitation } from "@/client/hooks/useTerritoireHabilitation";
import { determinerRemplissageAvancement } from "@/client/utils/avancement/determinerRemplissageAvancement";
import { determinerValeurAfficheeAvancement } from "@/client/utils/avancement/determinerValeurAfficheeAvancement";

export const useCartographieAvancement = (
  chantierMailles: Record<Maille, TerritoiresDonnées>,
  elementsDeLegende: CartographieÉlémentsDeLégende,
  jalon: number,
) => {
  const { récupérerDétailsSurUnTerritoire } = useTerritoireHabilitation();

  const useRecupererDonnees = () => {
    const donnees = objectEntries({
      ...chantierMailles.departementale,
      ...chantierMailles.regionale,
    }).map(([territoireCodeDonnee, territoire]) => ({
      valeur: territoire.avancement.global,
      valeurAnnuelle: territoire.avancement.annuel,
      territoireCode: territoireCodeDonnee as string,
      estApplicable: territoire.estApplicable,
    }));

    const legende = useMemo(() => {
      const tousApplicables: Boolean = donnees.every((d) => d.estApplicable);
      const tousNonNull: Boolean = donnees.every((d) => d.valeur !== null);

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
            "Territoire pour lequel la donnee n'est pas renseignee/disponible",
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
          contenu: determinerValeurAfficheeAvancement(
            val.valeurAnnuelle,
            val.estApplicable,
            jalon,
          ),
          remplissage: determinerRemplissageAvancement(
            val.valeurAnnuelle,
            elementsDeLegende,
            val.estApplicable,
          ),
          libellé: territoireGeographique.nomAffiché,
          estApplicable: val.estApplicable,
        },
      };
    }, {} as CartographieDonnées);
    return { legende, donneesCartographie };
  };
  return {
    useRecupererDonnees,
  };
};
