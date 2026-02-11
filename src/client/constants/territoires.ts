import { territoires as _territoires } from "@/client/constants/territoires.json";
import { DétailTerritoire } from "@/server/domain/territoire/Territoire.interface";

const territoires = _territoires as DétailTerritoire[];

const territoiresAccessiblesEnLecture = territoires.filter(
  (territoire) => territoire.accèsLecture,
);

export const listeTerritoires = {
  territoires,
  territoiresCodes: territoires.map((territoire) => territoire.code),
  départements: territoires.filter(
    (territoire) => territoire.maille === "departementale",
  ),
  régions: territoires.filter(
    (territoire) => territoire.maille === "regionale",
  ),
  territoiresAccessiblesEnLecture: territoiresAccessiblesEnLecture,
  maillesAccessiblesEnLecture: [
    ...new Set(
      territoiresAccessiblesEnLecture.map((territoire) => territoire.maille),
    ),
  ],
};

export const récupérerDétailsSurUnTerritoire = (
  territoireCode: string,
): DétailTerritoire => {
  return (territoires as DétailTerritoire[]).find(
    (territoire) => territoire.code === territoireCode,
  )!;
};
