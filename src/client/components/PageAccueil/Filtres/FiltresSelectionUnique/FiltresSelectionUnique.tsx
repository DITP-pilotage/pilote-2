import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { FunctionComponent } from "react";
import { useSession } from "next-auth/react";
import { sauvegarderFiltres } from "@/stores/useFiltresStoreNew/useFiltresStoreNew";
import api from "@/server/infrastructure/api/trpc/api";
import {
  statutArchive,
  statutBrouillon,
  statutBrouillonEtPublie,
  statutPublie,
} from "@/client/constants/statut";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import { FiltresSélectionUniqueStyled } from "./FiltresSelectionUnique.styled";

type AvailableFiltres = "statut";

interface FiltresSelectionUniqueProps {
  categorieDeFiltre: AvailableFiltres;
  libelle: string;
}

export const FiltresSelectionUnique: FunctionComponent<
  FiltresSelectionUniqueProps
> = ({ categorieDeFiltre, libelle }) => {
  const { data: session } = useSession();

  const { data: variableContenuFFPpgArchive } =
    api.gestionContenu.recupererVariableContenu.useQuery({
      nomVariableContenu: "NEXT_PUBLIC_FF_PPG_ARCHIVE",
    });
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
    "pageIndex",
    parseAsInteger.withDefault(1).withOptions({
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
    setPagination(1);
    setListeFiltresNew(valeur);
  };

  return (
    <FiltresSélectionUniqueStyled>
      <button
        aria-controls={`fr-sidemenu-item-${categorieDeFiltre}`}
        aria-expanded="false"
        className="fr-sidemenu__btn fr-m-0 fr-text--sm fr-py-1w"
        type="button"
      >
        {libelle}
      </button>
      <div className="fr-collapse" id={`fr-sidemenu-item-${categorieDeFiltre}`}>
        <ul className="fr-p-0 fr-m-0 fr-mb-1w fr-pl-1w">
          {valuesFiltres[categorieDeFiltre].valeurDisponible.map((filtre) => (
            <li className="fr-p-0 fr-my-1w fr-mr-0 flex gap-2" key={filtre.id}>
              <button
                className={`fr-tag fr-tag--icon-left fr-mr-1w ${filtresNew === filtre.id ? "fr-tag-active" : ""}`}
                id={`${categorieDeFiltre}-${filtre.id}`}
                key={`${categorieDeFiltre}-${filtre.id}`}
                onClick={() =>
                  filtresNew !== filtre.id && auChangement(filtre.id)
                }
                type="button"
              >
                {filtre.nom}
              </button>
              {filtre.texteInfobulle ? (
                <Infobulle>{filtre.texteInfobulle}</Infobulle>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </FiltresSélectionUniqueStyled>
  );
};
