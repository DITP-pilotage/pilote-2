import { ChartData, ChartDataset, ChartOptions } from "chart.js";
import { comparerDates, formaterDate } from "@/client/utils/date/date";
import { générerCouleursAléatoiresEntreDeuxCouleurs } from "@/client/utils/couleur/couleur";
import IndicateurÉvolutionProps from "./IndicateurÉvolution.interface";

export default function useIndicateurÉvolution(
  indicateurDétailsParTerritoires: IndicateurÉvolutionProps["indicateurDétailsParTerritoires"],
) {
  let donnéesParTerritoire: ChartData<"line">;
  const estEnSélectionMultiple = () =>
    indicateurDétailsParTerritoires.length > 1;
  const indicateurDétailsPourUnTerritoire = indicateurDétailsParTerritoires[0];
  const couleurs = générerCouleursAléatoiresEntreDeuxCouleurs(
    "#8bcdb1",
    "#083a25",
    indicateurDétailsParTerritoires.length,
  );

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { border: { dash: [2, 4] } },
      y: { border: { dash: [2, 4] }, beginAtZero: true },
    },
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { boxHeight: 0, boxWidth: 30, padding: 40 },
      },
    },
  };

  const datesDeTousLesIndicateurs = indicateurDétailsParTerritoires.flatMap(
    (detailIndicateur) =>
      detailIndicateur.données.historiquesValeurs.map((h) => h.date),
  );
  const listeDesDateOrdonnees = [...new Set(datesDeTousLesIndicateurs)].sort(
    (a, b) => comparerDates(a, b),
  );
  const valeursAxeX = listeDesDateOrdonnees.map((date) =>
    formaterDate(date, "MM/YYYY"),
  );

  if (valeursAxeX.length === 1) {
    valeursAxeX.push("");
  }

  const évolutions: ChartDataset<"line">[] =
    indicateurDétailsParTerritoires.map((détailsParTerritoire, index) => ({
      label: détailsParTerritoire.territoireNom,
      data: listeDesDateOrdonnees.map(
        (date) =>
          détailsParTerritoire.données.historiquesValeurs.find(
            (valeurHistorique) => valeurHistorique.date === date,
          )?.valeur ?? null,
      ),
      pointStyle: "rect",
      pointRadius: 5,
      borderColor: couleurs[index],
      backgroundColor: couleurs[index],
    }));

  if (estEnSélectionMultiple()) {
    donnéesParTerritoire = {
      labels: valeursAxeX,
      datasets: évolutions,
    };
  } else {
    const listeValeurCible = Array.from({ length: valeursAxeX.length }).map(
      () => indicateurDétailsPourUnTerritoire.données.valeurCible,
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
        indicateurDétailsPourUnTerritoire.données.valeurCible !== null
          ? [évolutions[0], valeurCible]
          : [évolutions[0]],
    };
  }

  return {
    donnéesParTerritoire,
    options,
  };
}
