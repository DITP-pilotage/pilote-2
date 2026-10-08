import {
  parseAsBoolean,
  parseAsString,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { parseAsTablePage } from "@/components/shared/DataTable/urlParsers";
import { FunctionComponent } from "react";
import { useSession } from "next-auth/react";
import { sauvegarderFiltres } from "@/stores/useFiltresStore/useFiltresStore";
import { useEnv } from "@/client/hooks/useEnv";
import {
  statutArchive,
  statutBrouillon,
  statutBrouillonEtPublie,
  statutPublie,
} from "@/client/constants/statut";
import { Infobulle } from "@/components/shared/Infobulle";
import { TagToggleGroup } from "@/components/shared/Tag";

type AvailableFiltres = "statut";

interface FiltresSelectionUniqueProps {
  categorieDeFiltre: AvailableFiltres;
  libelle: string;
}

export const FiltresSelectionUnique: FunctionComponent<
  FiltresSelectionUniqueProps
> = ({ categorieDeFiltre, libelle }) => {
  const { data: session } = useSession();

  const variableContenuFFPpgArchive = useEnv("NEXT_PUBLIC_FF_PPG_ARCHIVE");
  const profilPeutAccederAuxBrouillons =
    !!session?.profilAAccèsAuxChantiersBrouillons;

  type StatutFiltre = {
    id: string;
    nom: string;
    texteInfobulle: string | null;
  };

  const statutsDisponibles: StatutFiltre[] = profilPeutAccederAuxBrouillons
    ? [statutPublie, statutBrouillon, statutBrouillonEtPublie]
    : [statutPublie];

  if (variableContenuFFPpgArchive) {
    statutsDisponibles.push(statutArchive);
  }

  const valuesFiltres = {
    statut: {
      valeurDisponible: statutsDisponibles,
      valeurParDéfaut: "PUBLIE",
    },
  };

  const [filtresNew, setListeFiltresNew] = useQueryState(
    categorieDeFiltre,
    parseAsString
      .withDefault(valuesFiltres[categorieDeFiltre].valeurParDéfaut)
      .withOptions({
        shallow: false,
        clearOnDefault: true,
        history: "push",
      }),
  );

  const [, setFiltresAlertes] = useQueryStates(
    {
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

  const [, setPagination] = useQueryState(
    "page",
    parseAsTablePage.withOptions({
      shallow: false,
    }),
  );

  const auChangement = (valeur: string) => {
    if (valeur === "ARCHIVE") {
      const filtresAlertesReset = {
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteBaisse: false,
        estEnAlerteMétéoNonRenseignée: false,
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlertePossedePropositionsValeurAvancement: false,
      };

      setFiltresAlertes(filtresAlertesReset);
      sauvegarderFiltres(filtresAlertesReset);
    }
    sauvegarderFiltres({ [categorieDeFiltre]: valeur });
    setPagination(null);
    setListeFiltresNew(valeur);
  };

  return (
    <div>
      <button
        aria-controls={`fr-sidemenu-item-${categorieDeFiltre}`}
        aria-expanded="false"
        className="fr-sidemenu__btn fr-m-0 fr-text--sm fr-py-1w w-full text-left"
        type="button"
      >
        {libelle}
      </button>
      <div className="fr-collapse" id={`fr-sidemenu-item-${categorieDeFiltre}`}>
        <TagToggleGroup.Root
          aria-label={libelle}
          className="flex-col items-start gap-0 fr-mb-1w fr-pl-1w"
          onValueChange={auChangement}
          value={filtresNew}
        >
          {valuesFiltres[categorieDeFiltre].valeurDisponible.map((filtre) => (
            <div className="fr-my-1w flex items-center gap-2" key={filtre.id}>
              <TagToggleGroup.Item
                className="min-w-0 text-left"
                id={`${categorieDeFiltre}-${filtre.id}`}
                value={filtre.id}
              >
                {filtre.nom}
              </TagToggleGroup.Item>
              {filtre.texteInfobulle ? (
                <Infobulle>{filtre.texteInfobulle}</Infobulle>
              ) : null}
            </div>
          ))}
        </TagToggleGroup.Root>
      </div>
    </div>
  );
};
