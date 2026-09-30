import { FunctionComponent } from "react";
import { parseAsString, useQueryStates } from "nuqs";
import { parseAsTablePage } from "@/components/shared/DataTable/urlParsers";
import { FiltresSelectionMultiple } from "@/components/PageAccueil/Filtres/FiltresSelectionMultiple/FiltresSelectionMultiple";
import Ministère from "@/server/domain/ministère/Ministère.interface";
import Axe from "@/server/domain/axe/Axe.interface";
import Titre from "@/components/_commons/Titre/Titre";
import { sauvegarderFiltres } from "@/client/stores/useFiltresStore/useFiltresStore";
import { calculerNouvelleMaille } from "@/components/PageAccueil/Filtres/utils";
import { Maille } from "@/server/domain/maille/Maille.interface";
import { BoutonReintialiserLesFiltres } from "@/components/PageAccueil/BoutonReintialiserLesFiltres";
import FiltresGroupe from "./FiltresGroupe/FiltresGroupe";
import FiltresMinistères from "./FiltresMinistères/FiltresMinistères";
import { FiltresSelectionMultipleBoolean } from "./FiltresSelectionMultipleBoolean/FiltresSelectionMultipleBoolean";
import { FiltresSelectionUnique } from "./FiltresSelectionUnique/FiltresSelectionUnique";

interface FiltresProps {
  ministères: Ministère[];
  axes: Axe[];
  afficherToutLesFiltres: boolean;
  estProfilTerritorialise: boolean;
  estProfilRegionalAutoriseAVoirLaTerritorialisation: boolean;
}

export const Filtres: FunctionComponent<FiltresProps> = ({
  ministères,
  axes,
  afficherToutLesFiltres,
  estProfilTerritorialise,
  estProfilRegionalAutoriseAVoirLaTerritorialisation,
}) => {
  const [, setFiltres] = useQueryStates(
    {
      maille: parseAsString.withDefault(""),
      page: parseAsTablePage,
      axes: parseAsString.withDefault(""),
      territorialisation: parseAsString.withDefault(""),
    },
    {
      shallow: false,
      clearOnDefault: true,
      history: "push",
    },
  );

  const filtresTerritorialisation =
    estProfilRegionalAutoriseAVoirLaTerritorialisation
      ? [
          {
            id: "regionale",
            nom: "Régionale",
          },
          {
            id: "departementale",
            nom: "Départementale",
          },
        ]
      : [
          {
            id: "nationale",
            nom: "Nationale",
          },
          {
            id: "regionale",
            nom: "Régionale",
          },
          {
            id: "departementale",
            nom: "Départementale",
          },
        ];

  return (
    <>
      <div className="flex justify-between align-center fr-mb-1w fr-px-3w fr-mt-3w">
        <Titre baliseHtml="h1" className="fr-h4 fr-mb-0 flex align-center">
          Filtres
        </Titre>
        <BoutonReintialiserLesFiltres />
      </div>
      <section className="fr-px-3w">
        <FiltresMinistères ministères={ministères} />
      </section>
      {afficherToutLesFiltres ? (
        <FiltresGroupe>
          <FiltresSelectionMultiple
            categorieDeFiltre="axes"
            filtres={axes}
            libelle="Filtrer par axes"
            onChange={(nouveauFiltre) => {
              sauvegarderFiltres({ axes: nouveauFiltre });
              return setFiltres({
                axes: nouveauFiltre.join(","),
                page: null,
              });
            }}
          />
          {estProfilTerritorialise ? (
            <FiltresSelectionMultiple
              categorieDeFiltre="territorialisation"
              filtres={filtresTerritorialisation}
              libelle="Filtrer par territorialisation"
              onChange={(nouveauFiltre) => {
                const nouvelleMaille = calculerNouvelleMaille(
                  nouveauFiltre as Maille[],
                );

                sauvegarderFiltres({
                  territorialisation: nouveauFiltre,
                  maille: nouvelleMaille,
                });
                return setFiltres({
                  territorialisation: nouveauFiltre.join(","),
                  maille: nouvelleMaille,
                  page: null,
                });
              }}
            />
          ) : null}
          <FiltresSelectionUnique
            categorieDeFiltre="statut"
            libelle="Filtrer par statut"
          />
          <FiltresSelectionMultipleBoolean
            libelle="Autres filtres"
            listeCategorieDeFiltre={["estBarometre"]}
          />
        </FiltresGroupe>
      ) : null}
    </>
  );
};
