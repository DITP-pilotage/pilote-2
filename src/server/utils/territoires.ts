import { Maille } from '@prisma/client';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export function territoireCodeVersMailleCodeInsee(territoireCode: string): { maille: Maille, codeInsee: CodeInsee } {
  const tupleMailleCodeInsee = territoireCode.split('-');

  return {
    maille: tupleMailleCodeInsee[0] as Maille, 
    codeInsee: tupleMailleCodeInsee[1] as CodeInsee,
  };
}
