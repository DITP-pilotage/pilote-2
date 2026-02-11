import {
  createLoader,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { maillesInternes } from "@/server/domain/maille/Maille.interface";

const cartographieChantierTypes = [
  "avancementMandat",
  "avancementJalon",
  "meteo",
  "propositionValeur",
] as const;

const cartographieIndicateurTypes = [
  "avancementMandat",
  "avancementJalon",
  "propositionValeur",
  "valeurAvancement",
] as const;

export const loadChantierDetailSearchParams = createLoader({
  jalon: parseAsInteger,
  carteChG: parseAsStringLiteral([...cartographieChantierTypes]).withDefault(
    "avancementMandat",
  ),
  carteChD: parseAsStringLiteral([...cartographieChantierTypes]).withDefault(
    "meteo",
  ),
  carteIndG: parseAsStringLiteral([...cartographieIndicateurTypes]).withDefault(
    "avancementMandat",
  ),
  carteIndD: parseAsStringLiteral([...cartographieIndicateurTypes]).withDefault(
    "valeurAvancement",
  ),
  territoiresCompares: parseAsString,
  maille: parseAsStringLiteral([...maillesInternes]).withDefault(
    "departementale",
  ),
});
