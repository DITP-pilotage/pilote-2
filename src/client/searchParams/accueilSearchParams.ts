import { z } from "zod";
import {
  createLoader,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsJson,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import {
  mailles,
  maillesInternes,
} from "@/server/domain/maille/Maille.interface";

const sortingSchema = z.object({ id: z.string(), desc: z.boolean() });

const filtresParsers = {
  jalon: parseAsInteger,
  maille: parseAsStringLiteral([...maillesInternes]).withDefault(
    "departementale",
  ),
  sort: parseAsJson(sortingSchema.parse).withDefault({
    id: "avancement",
    desc: false,
  }),
  perimetres: parseAsArrayOf(parseAsString).withDefault([]),
  axes: parseAsArrayOf(parseAsString).withDefault([]),
  statut: parseAsString,
  meteos: parseAsArrayOf(parseAsString).withDefault([]),
  territorialisation: parseAsArrayOf(parseAsStringLiteral([...mailles])).withDefault([]),
  estBarometre: parseAsBoolean.withDefault(false),
  q: parseAsString,
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
  pageIndex: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(50),
});

export const loadRapportDetailleSearchParams = createLoader(filtresParsers);
