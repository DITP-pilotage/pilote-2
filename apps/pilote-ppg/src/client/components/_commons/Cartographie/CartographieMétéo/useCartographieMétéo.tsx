import { useMemo } from "react";
import { CartographieDonnées } from "@/components/_commons/Cartographie/Cartographie.interface";
import { libellesMeteos } from "@/server/domain/météo/Météo.interface";
import { CartographieÉlémentsDeLégende } from "@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface";
import { useTerritoireHabilitation } from "@/client/hooks/useTerritoireHabilitation";
import { CartographieDonnéesMétéo } from "./CartographieMétéo.interface";
import { getMeteoFill, getMeteoLegend } from "./meteoFill";

export function useCartographieMétéo(
  données: CartographieDonnéesMétéo,
  élémentsDeLégende: CartographieÉlémentsDeLégende,
) {
  const { récupérerDétailsSurUnTerritoire } = useTerritoireHabilitation();

  const légende = useMemo(
    () => getMeteoLegend(données, élémentsDeLégende),
    [élémentsDeLégende, données],
  );

  const donnéesCartographie = données.reduce((acc, val) => {
    const territoireGéographique = récupérerDétailsSurUnTerritoire(
      val.territoireCode,
    );

    return {
      ...acc,
      [val.territoireCode]: {
        contenu: (
          <div className="fr-text--bold">
            {val.estApplicable === false
              ? "Non applicable"
              : libellesMeteos[val.valeur]}
          </div>
        ),
        remplissage: getMeteoFill(
          val.valeur,
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
