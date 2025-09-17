import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from "nuqs";
import { reinitialiserFiltres } from "@/stores/useFiltresStoreNew/useFiltresStoreNew";
import { Icone } from "@/components/_commons/Icone";
import { ArrowGoBackIcon } from "@/components/_commons/Icones/ArrowGoBackIcon";

export const BoutonReintialiserLesFiltres = () => {
  const [, setFiltres] = useQueryStates(
    {
      maille: parseAsString.withDefault(""),
      pageIndex: parseAsInteger.withDefault(1),
      perimetres: parseAsString.withDefault(""),
      statut: parseAsString.withDefault(""),
      axes: parseAsString.withDefault(""),
      meteos: parseAsString.withDefault(""),
      estBarometre: parseAsBoolean.withDefault(false),
      territorialisation: parseAsString.withDefault(""),
      estEnAlerteTauxAvancementNonCalculé: parseAsBoolean.withDefault(false),
      estEnAlerteÉcart: parseAsBoolean.withDefault(false),
      estEnAlerteBaisse: parseAsBoolean.withDefault(false),
      estEnAlerteMétéoNonRenseignée: parseAsBoolean.withDefault(false),
      estEnAlerteAbscenceTauxAvancementDepartemental:
        parseAsBoolean.withDefault(false),
      estEnAlertePossedePropositionsValeurAvancement:
        parseAsBoolean.withDefault(false),
    },
    {
      shallow: false,
      clearOnDefault: true,
      history: "push",
    },
  );
  const désactiverTousLesFiltres = () => {
    reinitialiserFiltres();

    return setFiltres({
      perimetres: "",
      axes: "",
      meteos: "",
      statut: "PUBLIE",
      estBarometre: false,
      territorialisation: "",
      estEnAlerteTauxAvancementNonCalculé: false,
      estEnAlerteÉcart: false,
      estEnAlerteBaisse: false,
      estEnAlerteMétéoNonRenseignée: false,
      estEnAlerteAbscenceTauxAvancementDepartemental: false,
      estEnAlertePossedePropositionsValeurAvancement: false,
    });
  };
  return (
    <button
      className="flex gap-1 align-center !text-xs !text-primary !hover:bg-dsfr-blue-france-925-hover"
      onClick={désactiverTousLesFiltres}
      title="Réinitialiser les filtres"
      type="button"
    >
      <Icone className="w-4 h-4 rotate-y-180" icone={ArrowGoBackIcon} />
      Réinitialiser les filtres
    </button>
  );
};
