import { territoires as _territoires } from "@/client/constants/territoires.json";

interface DepartementInfo {
  code: string;
  nom: string;
  codeInsee: string;
}

interface RegionInfo {
  code: string;
  nom: string;
  codeInsee: string;
  departements: DepartementInfo[];
}

export function buildTerritoireHierarchy(): RegionInfo[] {
  const regions = _territoires.filter((t) => t.maille === "regionale");
  const departements = _territoires.filter(
    (t) => t.maille === "departementale",
  );

  return regions.map((region) => ({
    code: region.code,
    nom: region.nom,
    codeInsee: region.codeInsee,
    departements: departements
      .filter((dept) => dept.codeParent === region.code)
      .map((dept) => ({
        code: dept.code,
        nom: dept.nom,
        codeInsee: dept.codeInsee,
      })),
  }));
}
