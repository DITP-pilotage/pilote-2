import { faker } from '@faker-js/faker';
import { codesInseeDépartements, codesInseeRégions, codeInseeFrance } from '@/server/domain/territoire/Territoire.interface';

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

export function générerUneMailleAléatoire(): 'DEPT' | 'REG' | 'NAT' {
  return faker.helpers.arrayElement(['DEPT', 'REG', 'NAT']);
}

export function retourneUneListeDeCodeInseeCohérentePourUneMaille(maille: string) {
  if (maille === 'DEPT')
    return codesInseeDépartements;

  if (maille === 'REG')
    return codesInseeRégions;
    
  return [codeInseeFrance];
}
