import {
  CartographieÉlémentDeLégende,
  CartographieÉlémentsDeLégende,
  Remplissage,
} from "@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface";
import { CartographieDonnéesAvancement } from "./CartographieAvancement.interface";

const TRANCHES = [
  "0-10",
  "10-20",
  "20-30",
  "30-40",
  "40-50",
  "50-60",
  "60-70",
  "70-80",
  "80-90",
  "90-100",
];

export function getAvancementFill(
  valeur: number | null,
  élémentsDeLégende: CartographieÉlémentsDeLégende,
  estApplicable: boolean | null,
): Remplissage {
  if (estApplicable === false) {
    return élémentsDeLégende.NON_APPLICABLE.remplissage;
  }
  if (valeur === null) return élémentsDeLégende.DÉFAUT.remplissage;

  const roundedValue = Number(valeur.toFixed(0));
  if (roundedValue < 0) return élémentsDeLégende.DÉFAUT.remplissage;
  const tranche = TRANCHES[Math.min(Math.floor(roundedValue / 10), 9)];
  return élémentsDeLégende[tranche].remplissage;
}

export function getAvancementLegend(
  données: CartographieDonnéesAvancement,
  élémentsDeLégende: CartographieÉlémentsDeLégende,
): CartographieÉlémentDeLégende[] {
  const allApplicable = données.every((donnée) => donnée.estApplicable);
  const allFilled = données.every((donnée) => donnée.valeur !== null);

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
            "Territoire pour lequel la donnée n'est pas renseignée/disponible"
        ),
    )
    .map(({ remplissage, libellé }) => ({ libellé, remplissage }));
}
