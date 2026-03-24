import { territoires as _territoires } from "@/client/constants/territoires.json";
import { PickerOptionGroup } from "@/components/shared/Picker";
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

export const territoireFrance = territoires.find(
  (t) => t.maille === "nationale",
)!;

export const territoiresGroupesPourPicker: PickerOptionGroup<string>[] = [
  {
    libelle: territoireFrance.nomAffiché,
    valeur: territoireFrance.code,
    options: [
      { libelle: territoireFrance.nomAffiché, valeur: territoireFrance.code },
    ],
  },
  ...listeTerritoires.régions.map((region) => {
    const departements = listeTerritoires.départements.filter(
      (dept) => dept.codeParent === region.code,
    );

    return {
      libelle: region.nomAffiché,
      valeur: region.code,
      options: [
        { libelle: region.nomAffiché, valeur: region.code },
        ...departements.map((dept) => ({
          libelle: dept.nomAffiché,
          valeur: dept.code,
        })),
      ],
    };
  }),
];

export const récupérerDétailsSurUnTerritoire = (
  territoireCode: string,
): Territoire => {
  return (territoires as Territoire[]).find(
    (territoire) => territoire.code === territoireCode,
  )!;
};

export const getListeTerritoires = (maille: string) => {
  if (maille === "departementale") {
    return listeTerritoires.départements;
  }

  return listeTerritoires.régions;
};
