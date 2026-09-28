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
  parseAsSorting,
  parseAsTablePage,
} from "@/components/shared/DataTable/urlParsers";

const filtresParsers = {
  jalon: parseAsInteger,
  maille: parseAsStringLiteral([...maillesInternes]).withDefault(
    "departementale",
  ),
  sort: parseAsSorting.withDefault([{ id: "avancement", desc: false }]),
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
