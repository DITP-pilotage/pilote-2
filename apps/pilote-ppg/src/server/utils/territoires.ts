import { Maille } from "@prisma/client";
import { CodeInsee } from "@/shared/territoire/Territoire.interface";
import { MailleTerritoireSelectionne } from "@/shared/maille/Maille.interface";

export const territoireCodeVersMailleCodeInsee = (
  territoireCode: string,
): { maille: Maille; codeInsee: CodeInsee } => {
  const [maille, codeInsee] = territoireCode.split("-");

  return { maille: maille as MailleTerritoireSelectionne, codeInsee };
};
