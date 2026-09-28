import { FunctionComponent } from "react";
import SélecteurCustom from "@/components/_commons/SelecteurCustom/SélecteurAvecRecherche/SélecteurCustom";
import { SortButtons } from "@/components/shared/DataTable/SortButtons";
import type { AnyColumn } from "@/components/shared/DataTable/types";
import type { TableauDesChantiers } from "./useTableauChantiers";

const listeColonnesÀtrier = [
  {
    libellé: "Taux d'avancement",
    valeur: "avancement",
    désactivé: false,
  },
  {
    libellé: "Météo",
    valeur: "météo",
    désactivé: false,
  },
  {
    libellé: "Date de mise à jour des données",
    valeur: "dateDeMàjDonnéesQuantitatives",
    désactivé: process.env.NEXT_PUBLIC_FF_TRI_DATES !== "true",
  },
  {
    libellé: "Date de mise à jour de la météo et de la synthèse des résultats",
    valeur: "dateDeMàjDonnéesQualitatives",
    désactivé: process.env.NEXT_PUBLIC_FF_TRI_DATES !== "true",
  },
  {
    libellé: "Tendance",
    valeur: "tendance",
    désactivé: false,
  },
  {
    libellé: "Écart",
    valeur: "écart",
    désactivé: false,
  },
];

const TRI_PAR_DÉFAUT = { id: "avancement", desc: false };

export const TableauChantiersActionsDeTri: FunctionComponent<{
  tableau: TableauDesChantiers;
}> = ({ tableau }) => {
  const [triURL] = tableau.store.state.sorting;
  const tri =
    triURL &&
    listeColonnesÀtrier.some((colonne) => colonne.valeur === triURL.id)
      ? triURL
      : TRI_PAR_DÉFAUT;

  return (
    <div className="flex align-end w-full max-w-[22rem] gap-2">
      <div className="flex flex-col gap-1 mb-0 sélecteur-colonne-à-trier">
        <label className="text-sm/6" htmlFor="tri-tableau-chantiers">
          Trier par
        </label>
        <SélecteurCustom
          htmlName="tri-tableau-chantiers"
          options={listeColonnesÀtrier}
          valeurModifiéeCallback={(triSélectionné) =>
            tableau.setSorting([{ id: triSélectionné, desc: tri.desc }])
          }
          valeurSélectionnée={tri.id}
        />
      </div>
      <div className="mb-2">
        <SortButtons
          column={tableau.getColumn(tri.id) as AnyColumn}
          label={
            listeColonnesÀtrier.find((colonne) => colonne.valeur === tri.id)
              ?.libellé ?? tri.id
          }
        />
      </div>
    </div>
  );
};
