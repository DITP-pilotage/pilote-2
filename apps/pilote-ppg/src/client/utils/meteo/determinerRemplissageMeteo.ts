import { Meteo } from "@/server/domain/météo/Météo.interface";
import { CartographieÉlémentsDeLégende } from "@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface";

export const determinerRemplissageMeteo = (
  valeur: Meteo | null,
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
