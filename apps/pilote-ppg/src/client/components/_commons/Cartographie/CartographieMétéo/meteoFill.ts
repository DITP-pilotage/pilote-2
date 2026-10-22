import { Meteo } from "@/shared/meteo/Meteo.interface";
import {
  CartographieÉlémentDeLégende,
  CartographieÉlémentsDeLégende,
  Remplissage,
} from "@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface";
import { CartographieDonnéesMétéo } from "./CartographieMétéo.interface";

const METEOS_AVEC_COULEUR = new Set<Meteo>([
  "ORAGE",
  "COUVERT",
  "NUAGE",
  "SOLEIL",
]);

export function getMeteoFill(
  valeur: Meteo | null,
  élémentsDeLégende: CartographieÉlémentsDeLégende,
  estApplicable: boolean | null,
): Remplissage {
  if (estApplicable === false) {
    return élémentsDeLégende.NON_APPLICABLE.remplissage;
  }
  if (valeur && METEOS_AVEC_COULEUR.has(valeur)) {
    return élémentsDeLégende[valeur].remplissage;
  }
  return élémentsDeLégende.DÉFAUT.remplissage;
}

export function getMeteoLegend(
  données: CartographieDonnéesMétéo,
  élémentsDeLégende: CartographieÉlémentsDeLégende,
): CartographieÉlémentDeLégende[] {
  const allApplicable = données.every((donnée) => donnée.estApplicable);
  const allFilled = données.every(
    (donnée) => donnée.valeur !== "NON_RENSEIGNEE",
  );

  return Object.values(élémentsDeLégende)
    .filter(
      (élément) =>
        !(
          allApplicable &&
          élément.libellé ===
            "Territoire où le chantier prioritaire ne s'applique pas"
        ) &&
        !(
          allFilled &&
          élément.libellé ===
            "Territoire pour lequel la météo n'est pas renseignée"
        ),
    )
    .map(({ remplissage, libellé }) => ({ libellé, remplissage }));
}
