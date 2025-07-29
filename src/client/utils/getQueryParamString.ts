import {
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
  parseAsBoolean,
} from "nuqs";
import { FiltreAccueil } from "@/stores/useFiltresStoreNew/useFiltresStoreNew";

const listeKeyPositiveBooleanExclusion = new Set(["brouillon"]);

export const getQueryParamString = (
  filtres: object,
  filtresExclus: Set<string> = new Set(),
  init: Partial<FiltreAccueil> = {} as Partial<FiltreAccueil>,
): string => {
  return new URLSearchParams(
    Object.entries(filtres)
      .map(([key, value]) => {
        const valeurAVerifier =
          init[key as keyof FiltreAccueil] !== undefined
            ? init[key as keyof FiltreAccueil]
            : (value as string);
        return !filtresExclus.has(key) &&
          ((listeKeyPositiveBooleanExclusion.has(key) &&
            valeurAVerifier === false) ||
            (!listeKeyPositiveBooleanExclusion.has(key) && valeurAVerifier)) &&
          String(valeurAVerifier).length > 0
          ? [key, String(valeurAVerifier)]
          : [];
      })
      .filter((value) => value.length > 0),
  ).toString();
};

export const useGetFullQueryParamString = (): string => {
  const [filtres] = useQueryStates({
    perimetres: parseAsString.withDefault(""),
    axes: parseAsString.withDefault(""),
    meteos: parseAsString.withDefault(""),
    estBarometre: parseAsBoolean.withDefault(false),
    territorialisation: parseAsString.withDefault(""),
    maille: parseAsString.withDefault(""),
    statut: parseAsStringLiteral([
      "BROUILLON",
      "PUBLIE",
      "BROUILLON_ET_PUBLIE",
      "ARCHIVE",
    ]),
    jalon: parseAsStringLiteral(["2024", "2025"]),
  });

  const [filtresAlertes] = useQueryStates({
    estEnAlerteTauxAvancementNonCalculé: parseAsBoolean.withDefault(false),
    estEnAlerteÉcart: parseAsBoolean.withDefault(false),
    estEnAlerteBaisse: parseAsBoolean.withDefault(false),
    estEnAlerteMétéoNonRenseignée: parseAsBoolean.withDefault(false),
    estEnAlerteAbscenceTauxAvancementDepartemental:
      parseAsBoolean.withDefault(false),
    estEnAlertePossedePropositionsValeurAvancement:
      parseAsBoolean.withDefault(false),
  });

  return getQueryParamString({ ...filtres, ...filtresAlertes });
};
