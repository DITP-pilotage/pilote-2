import { Maille } from '@prisma/client';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { MailleTerritoireSelectionne } from '@/server/chantiers/domain/Maille';

export const territoireCodeVersMailleCodeInsee = (territoireCode: string): { maille: Maille, codeInsee: CodeInsee } => {
  const [maille, codeInsee] = territoireCode.split('-');

  return { maille: maille as MailleTerritoireSelectionne, codeInsee };
};
