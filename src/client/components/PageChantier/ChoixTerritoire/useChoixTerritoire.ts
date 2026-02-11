import { useMemo } from "react";
import { CartographieDonnées } from "@/components/_commons/Cartographie/Cartographie.interface";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { listeTerritoires } from "@/client/constants/territoires";

export default function useChoixTerritoire(mailleSélectionnée: MailleInterne) {
  const { territoires } = listeTerritoires;

  const donnéesCartographie = useMemo(() => {
    const donnéesFormatées: CartographieDonnées = {};

    territoires
      .filter((territoire) => territoire.maille === mailleSélectionnée)
      .forEach((territoire) => {
        donnéesFormatées[territoire.code] = {
          contenu: undefined,
          remplissage: "#bababa",
          libellé: territoire.nomAffiché,
          estApplicable: true,
        };
      });

    return donnéesFormatées;
  }, [mailleSélectionnée, territoires]);

  return {
    donnéesCartographie,
  };
}
