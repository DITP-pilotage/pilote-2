import { startTransition, useState } from "react";
import { TypeCarteIndicateur } from "./ComparaisonTerritoires.interface";

export const useComparaisonTerritoiresIndicateur = () => {
  const [panneauGauche, setPanneauGauche] =
    useState<TypeCarteIndicateur>("ta");
  const [panneauDroite, setPanneauDroite] =
    useState<TypeCarteIndicateur | null>(null);

  const changerTypeCarte = (
    panneau: "gauche" | "droite",
    type: TypeCarteIndicateur,
  ) => {
    startTransition(() => {
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
    });
  };

  const activerComparaison = () => {
    setPanneauDroite(
      panneauGauche === "ta" ? "valeurAvancement" : "ta",
    );
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
