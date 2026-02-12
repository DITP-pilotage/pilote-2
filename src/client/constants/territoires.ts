import { territoires as _territoires } from "@/client/constants/territoires.json";
import { Territoire } from "@/server/domain/territoire/Territoire.interface";

const territoires = _territoires as Territoire[];

export const listeTerritoires = {
  territoires,
  départements: territoires.filter(
    (territoire) => territoire.maille === "departementale",
  ),
  régions: territoires.filter(
    (territoire) => territoire.maille === "regionale",
  ),
};

export const récupérerDétailsSurUnTerritoire = (
  territoireCode: string,
): Territoire => {
  return (territoires as Territoire[]).find(
    (territoire) => territoire.code === territoireCode,
  )!;
};
