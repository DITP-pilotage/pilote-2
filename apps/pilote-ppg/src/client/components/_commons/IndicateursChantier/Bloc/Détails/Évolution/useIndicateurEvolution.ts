import { ChartData, ChartDataset } from "chart.js";
import { comparerDates, formaterDate } from "@/client/utils/date/date";
import { générerCouleursAléatoiresEntreDeuxCouleurs } from "@/client/utils/couleur/couleur";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";
import { useTerritoireSelectionne } from "@/components/PageChantier/PageChantierServerSideContext";

export const useIndicateurEvolution = () => {
  const { detailIndicateurDuTerritoire } = useBlocIndicateurContext();
  const detailTerritoireSelectionne = useTerritoireSelectionne();
  let donnéesParTerritoire: ChartData<"line">;

  const couleurs = générerCouleursAléatoiresEntreDeuxCouleurs(
    "#8bcdb1",
    "#083a25",
    1,
  );

  const datesDeTousLesIndicateurs =
    detailIndicateurDuTerritoire.historiquesValeurs.map((h) => h.date);

  const listeDesDateOrdonnees = [...new Set(datesDeTousLesIndicateurs)].sort(
    (a, b) => comparerDates(a, b),
  );
  const valeursAxeX = listeDesDateOrdonnees.map((date) =>
    formaterDate(date, "MM/YYYY"),
  );

  if (valeursAxeX.length === 1) {
    valeursAxeX.push("");
  }

  const évolutions: ChartDataset<"line">[] = [
    {
      label: detailTerritoireSelectionne.nom,
      data: listeDesDateOrdonnees.map(
        (date) =>
          detailIndicateurDuTerritoire.historiquesValeurs.find(
            (valeurHistorique) => valeurHistorique.date === date,
          )?.valeur ?? null,
      ),
      pointStyle: "rect",
      pointRadius: 5,
      borderColor: couleurs[0],
      backgroundColor: couleurs[0],
    },
  ];

  const listeValeurCible = Array.from({ length: valeursAxeX.length }).map(
    () => detailIndicateurDuTerritoire.valeurCible,
  );

  const valeurCible: ChartDataset<"line"> = {
    label: "Cible",
    data: listeValeurCible,
    borderColor: "#FC5D00",
    backgroundColor: "transparent",
    borderDash: [10, 12],
    pointStyle: false,
    pointHitRadius: 0,
    pointRadius: 0,
  };

  donnéesParTerritoire = {
    labels: valeursAxeX,
    datasets:
      detailIndicateurDuTerritoire.valeurCible !== null
        ? [évolutions[0], valeurCible]
        : [évolutions[0]],
  };

  return {
    donnéesParTerritoire,
  };
};
