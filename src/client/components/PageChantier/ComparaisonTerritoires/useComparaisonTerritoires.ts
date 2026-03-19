import { useState } from "react";
import { TypeCarte } from "./ComparaisonTerritoires.interface";

export const useComparaisonTerritoires = () => {
  const [panneauGauche, setPanneauGauche] = useState<TypeCarte>("ta");
  const [panneauDroite, setPanneauDroite] = useState<TypeCarte | null>(null);

  const changerTypeCarte = (panneau: "gauche" | "droite", type: TypeCarte) => {
    if (panneau === "gauche") {
      if (panneauDroite === type) {
        setPanneauDroite(panneauGauche);
      }
      setPanneauGauche(type);
    } else {
      if (panneauGauche === type) {
        setPanneauGauche(panneauDroite!);
      }
      setPanneauDroite(type);
    }
  };

  const activerComparaison = () => {
    setPanneauDroite(panneauGauche === "ta" ? "meteo" : "ta");
  };

  const supprimerPanneau = (panneau: "gauche" | "droite") => {
    if (panneau === "gauche") {
      setPanneauGauche(panneauDroite!);
    }
    setPanneauDroite(null);
  };

  return {
    panneauGauche,
    panneauDroite,
    changerTypeCarte,
    activerComparaison,
    supprimerPanneau,
  };
};
