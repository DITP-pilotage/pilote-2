import { ReactNode, useMemo } from "react";
import { actionsTerritoiresStore } from "@/stores/useTerritoiresStore/useTerritoiresStore";
import { CartographieÉlémentsDeLégende } from "@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface";
import { CartographieDonnées } from "@/client/components/_commons/Cartographie/Cartographie.interface";
import { objectEntries } from "@/client/utils/objects/objects";
import { TerritoiresDonnées } from "@/server/domain/territoire/Territoire.interface";
import { Maille } from "@/server/domain/maille/Maille.interface";

const determinerValeurAffichee = (
  valeur: number | null,
  valeurAnnuelle: number | null,
  estApplicable: boolean | null,
  jalon: number,
): ReactNode => {
  if (estApplicable === false) {
    return <span className="fr-text--bold">Non applicable</span>;
  }

  if (valeur === null) {
    return <span className="fr-text--bold">Non renseigné</span>;
  }

  if (valeurAnnuelle === null) {
    return (
      <div className="fr-text--bold">{`TA 2026 : ${valeur.toFixed(0)}%`}</div>
    );
  }

  return (
    <>
      {`TA ${jalon} : ${valeurAnnuelle.toFixed(0)}% | `}
      <span className="fr-text--bold">{`TA 2026 : ${valeur.toFixed(0)}%`}</span>
    </>
  );
};

const determinerRemplissage = (
  valeur: number | null,
  elementsDeLegende: CartographieÉlémentsDeLégende,
  estApplicable: boolean | null,
) => {
  if (estApplicable === false) {
    return elementsDeLegende.NON_APPLICABLE.remplissage;
  }

  if (valeur === null) return elementsDeLegende.DÉFAUT.remplissage;

  const valeurArrondie = Number(valeur.toFixed(0));

  if (valeurArrondie >= 0 && valeurArrondie < 10)
    return elementsDeLegende["0-10"].remplissage;
  else if (valeurArrondie >= 10 && valeurArrondie < 20)
    return elementsDeLegende["10-20"].remplissage;
  else if (valeurArrondie >= 20 && valeurArrondie < 30)
    return elementsDeLegende["20-30"].remplissage;
  else if (valeurArrondie >= 30 && valeurArrondie < 40)
    return elementsDeLegende["30-40"].remplissage;
  else if (valeurArrondie >= 40 && valeurArrondie < 50)
    return elementsDeLegende["40-50"].remplissage;
  else if (valeurArrondie >= 50 && valeurArrondie < 60)
    return elementsDeLegende["50-60"].remplissage;
  else if (valeurArrondie >= 60 && valeurArrondie < 70)
    return elementsDeLegende["60-70"].remplissage;
  else if (valeurArrondie >= 70 && valeurArrondie < 80)
    return elementsDeLegende["70-80"].remplissage;
  else if (valeurArrondie >= 80 && valeurArrondie < 90)
    return elementsDeLegende["80-90"].remplissage;
  else if (valeurArrondie >= 90) return elementsDeLegende["90-100"].remplissage;
  else return elementsDeLegende.DÉFAUT.remplissage;
};

export const useCartographieAvancement = (
  chantierMailles: Record<Maille, TerritoiresDonnées>,
  elementsDeLegende: CartographieÉlémentsDeLégende,
  jalon: number,
  typeAvancement: "JALON" | "MANDAT",
) => {
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

    const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

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
          contenu: determinerValeurAffichee(
            val.valeur,
            val.valeurAnnuelle,
            val.estApplicable,
            jalon,
          ),
          remplissage: determinerRemplissage(
            typeAvancement === "JALON" ? val.valeurAnnuelle : val.valeur,
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
