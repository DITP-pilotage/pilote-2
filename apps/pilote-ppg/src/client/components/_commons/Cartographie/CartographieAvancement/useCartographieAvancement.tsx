import { ReactNode, useMemo } from "react";
import { CartographieDonnées } from "@/components/_commons/Cartographie/Cartographie.interface";
import { CartographieÉlémentsDeLégende } from "@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface";
import { useTerritoireHabilitation } from "@/client/hooks/useTerritoireHabilitation";
import { CartographieDonnéesAvancement } from "./CartographieAvancement.interface";
import { getAvancementFill, getAvancementLegend } from "./avancementFill";

function déterminerValeurAffichée(
  valeurAnnuelle: number | null,
  estApplicable: boolean | null,
  jalon: number,
): ReactNode {
  if (estApplicable === false) {
    return <span className="fr-text--bold">Non applicable</span>;
  }

  if (valeurAnnuelle === null) {
    return <span className="fr-text--bold">Non renseigné</span>;
  }

  return <>{`TA ${jalon} : ${valeurAnnuelle.toFixed(0)}%`}</>;
}

export function useCartographieAvancement(
  données: CartographieDonnéesAvancement,
  élémentsDeLégende: CartographieÉlémentsDeLégende,
  jalon: number,
) {
  const { récupérerDétailsSurUnTerritoire } = useTerritoireHabilitation();

  const légende = useMemo(
    () => getAvancementLegend(données, élémentsDeLégende),
    [élémentsDeLégende, données],
  );

  const donnéesCartographie = données.reduce((acc, val) => {
    const territoireGéographique = récupérerDétailsSurUnTerritoire(
      val.territoireCode,
    );

    return {
      ...acc,
      [val.territoireCode]: {
        contenu: déterminerValeurAffichée(
          val.valeurAnnuelle,
          val.estApplicable,
          jalon,
        ),
        remplissage: getAvancementFill(
          val.valeurAnnuelle,
          élémentsDeLégende,
          val.estApplicable,
        ),
        libellé: territoireGéographique.nomAffiché,
        estApplicable: val.estApplicable,
      },
    };
  }, {} as CartographieDonnées);

  return {
    légende,
    donnéesCartographie,
  };
}
