import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { territoires as _territoires } from "@/client/constants/territoires.json";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import {
  DétailTerritoire,
  Territoire,
} from "@/server/domain/territoire/Territoire.interface";

const territoires = _territoires as Territoire[];

export const useTerritoireHabilitation = () => {
  const { data: session } = useSession();

  const habilitations = session!.habilitations;

  return useMemo(() => {
    const habilitation = new Habilitation(habilitations);

    const listeTerritoires: DétailTerritoire[] = territoires.map(
      (territoire) => ({
        ...territoire,
        accèsLecture: habilitation.peutAccéderAuTerritoire(territoire.code),
        accèsSaisiePublication:
          habilitation.peutSaisirDesPublicationsPourUnTerritoire(
            territoire.code,
          ),
        accèsSaisieIndicateur:
          habilitation.peutSaisirDesIndicateursPourUnTerritoire(
            territoire.code,
          ),
      }),
    );

    const territoiresAccessiblesEnLecture = listeTerritoires.filter(
      (territoire) => territoire.accèsLecture,
    );

    const maillesAccessiblesEnLecture = [
      ...new Set(
        territoiresAccessiblesEnLecture.map((territoire) => territoire.maille),
      ),
    ];

    const récupérerDétailsSurUnTerritoire = (territoireCode: string) => {
      return listeTerritoires.find(
        (territoire) => territoire.code === territoireCode,
      )!;
    };

    return {
      listeTerritoires,
      territoiresAccessiblesEnLecture,
      maillesAccessiblesEnLecture,
      récupérerDétailsSurUnTerritoire,
    };
  }, [habilitations]);
};
