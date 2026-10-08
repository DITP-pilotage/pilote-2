import { useMemo } from "react";
import { MailleInterne } from "@/shared/maille/Maille.interface";
import { listeTerritoires } from "@/client/constants/territoires";
import { CartographieV2Donnee } from "@/components/_commons/CartographieV2/types";
import { useTerritoireHabilitation } from "@/client/hooks/useTerritoireHabilitation";

export function useChoixTerritoire(mailleSélectionnée: MailleInterne) {
  const { territoires } = listeTerritoires;
  const { listeTerritoires: territoiresHabilites } =
    useTerritoireHabilitation();

  const donnéesCartographie = useMemo(
    () =>
      Object.fromEntries(
        territoires
          .filter((territoire) => territoire.maille === mailleSélectionnée)
          .map((territoire): [string, CartographieV2Donnee] => [
            territoire.code,
            { remplissage: "#bababa", libelle: territoire.nomAffiché },
          ]),
      ),
    [mailleSélectionnée, territoires],
  );

  const territoiresSelectionnables = useMemo(
    () =>
      territoiresHabilites
        .filter((territoire) => territoire.accèsLecture)
        .map((territoire) => territoire.code),
    [territoiresHabilites],
  );

  return { donnéesCartographie, territoiresSelectionnables };
}
