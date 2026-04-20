import { CartographieÉlémentsDeLégende } from "@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface";

export const determinerRemplissageAvancement = (
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
