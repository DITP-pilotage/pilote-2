import { faker } from '@faker-js/faker';
import { CodeInsee, codesInseeDépartements, codesInseeRégions, codeInseeFrance } from '@/server/domain/territoire/Territoire.interface';

export function générerUnIdentifiantUnique(prefixe: string) {
  return `${prefixe}-${faker.helpers.unique(faker.random.numeric, [5])}`;
}

export function générerCaractèresSpéciaux(nombre: number) {
  const caractères = ['/', ':', '@', '[', ']', '#', 'é'];
  return Array.from({ length: nombre })
    .map(() => caractères[Math.floor(Math.random() * caractères.length)])
    .join('');
}

export function générerUnTableauVideAvecUneTailleDeZéroÀn(nombreMaxÉléments = 4) {
  const nombreItération = Math.floor(Math.random() * (nombreMaxÉléments + 1));
  return Array.from({ length: nombreItération });
}

export function génèreUneMailleAléatoireEtUneListeDeCodesInseeCohérente() {
  let codesInsee: readonly CodeInsee[];

  const maille = faker.helpers.arrayElement(['DEPT', 'REG', 'NAT']);

  if (maille === 'DEPT')
    codesInsee = codesInseeDépartements;
  else if (maille === 'REG')
    codesInsee = codesInseeRégions;
  else
    codesInsee = [codeInseeFrance];

  return {
    maille,
    codesInsee,
  };
}
