import { startTransition, useState } from "react";

type UseComparaisonTerritoiresConfig<T extends string> = {
  typeParDefaut: T;
  typeAlternatif: (typeActuel: T) => T;
};

export const useComparaisonTerritoires = <T extends string>(
  config: UseComparaisonTerritoiresConfig<T>,
) => {
  const [panneauGauche, setPanneauGauche] = useState<T>(config.typeParDefaut);
  const [panneauDroite, setPanneauDroite] = useState<T | null>(
    config.typeAlternatif(panneauGauche),
  );

  const changerTypeCarte = (panneau: "gauche" | "droite", type: T) => {
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
    startTransition(() => {
      setPanneauDroite(config.typeAlternatif(panneauGauche));
    });
  };

  const supprimerPanneau = (panneau: "gauche" | "droite") => {
    startTransition(() => {
      if (panneau === "gauche") {
        setPanneauGauche(panneauDroite!);
      }
      setPanneauDroite(null);
    });
  };

  return {
    panneauGauche,
    panneauDroite,
    changerTypeCarte,
    activerComparaison,
    supprimerPanneau,
  };
};
