import {
  createLoader,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import {
  mailles,
  maillesInternes,
} from "@/server/domain/maille/Maille.interface";
import {
  parseAsSortingAmong,
  parseAsTablePage,
} from "@/components/shared/DataTable/urlParsers";
import {
  CRITERES_TRI_CHANTIERS,
  TRI_CHANTIERS_PAR_DEFAUT,
} from "@/server/chantiers/app/contrats/TriChantiers";

const filtresParsers = {
  jalon: parseAsInteger,
  maille: parseAsStringLiteral([...maillesInternes]).withDefault(
    "departementale",
  ),
  sort: parseAsSortingAmong(CRITERES_TRI_CHANTIERS).withDefault([
    TRI_CHANTIERS_PAR_DEFAUT,
  ]),
  perimetres: parseAsArrayOf(parseAsString).withDefault([]),
  axes: parseAsArrayOf(parseAsString).withDefault([]),
  statut: parseAsStringLiteral([
    "BROUILLON",
    "PUBLIE",
    "BROUILLON_ET_PUBLIE",
    "ARCHIVE",
  ]),
  meteos: parseAsArrayOf(parseAsString).withDefault([]),
  territorialisation: parseAsArrayOf(
    parseAsStringLiteral([...mailles]),
  ).withDefault([]),
  estBarometre: parseAsBoolean.withDefault(false),
  q: parseAsString.withDefault(""),
  estEnAlerteTauxAvancementNonCalculé: parseAsBoolean.withDefault(false),
  estEnAlerteÉcart: parseAsBoolean.withDefault(false),
  estEnAlerteBaisse: parseAsBoolean.withDefault(false),
  estEnAlerteMétéoNonRenseignée: parseAsBoolean.withDefault(false),
  estEnAlerteAbscenceTauxAvancementDepartemental:
    parseAsBoolean.withDefault(false),
  estEnAlertePossedePropositionsValeurAvancement:
    parseAsBoolean.withDefault(false),
};

export const loadAccueilSearchParams = createLoader({
  ...filtresParsers,
  page: parseAsTablePage,
  pageSize: parseAsInteger.withDefault(50),
});

export const loadRapportDetailleSearchParams = createLoader(filtresParsers);
