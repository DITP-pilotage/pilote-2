import {
  createLoader,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { maillesInternes } from "@/shared/maille/Maille.interface";

const cartographieIndicateurTypes = [
  "avancementJalon",
  "propositionValeur",
  "valeurAvancement",
] as const;

export const loadChantierDetailSearchParams = createLoader({
  jalon: parseAsInteger,
  carteIndG: parseAsStringLiteral([...cartographieIndicateurTypes]).withDefault(
    "avancementJalon",
  ),
  carteIndD: parseAsStringLiteral([...cartographieIndicateurTypes]).withDefault(
    "valeurAvancement",
  ),
  territoiresCompares: parseAsString,
  maille: parseAsStringLiteral([...maillesInternes]).withDefault(
    "departementale",
  ),
});
