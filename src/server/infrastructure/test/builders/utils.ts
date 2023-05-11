import { faker } from '@faker-js/faker/locale/fr';
import {
  codeInseeFrance,
  codesInseeDépartements,
  codesInseeRégions,
} from '@/server/domain/territoire/Territoire.interface';

export function générerUnIdentifiantUnique(prefixe: string) {
  return `${prefixe}-${faker.helpers.unique(faker.random.numeric, [7])}`;
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

export function générerUnLibellé(nomdeDeMotsMin: number, nomdeDeMotsMax: number) {
  const nom = faker.lorem.words(faker.datatype.number({ min: nomdeDeMotsMin, max: nomdeDeMotsMax }));
  return nom.charAt(0).toUpperCase() + nom.slice(1);
}

export function générerTableau<T>(nombreOccurrenceMin: number, nombreOccurrenceMax: number, entitéBuilder: (i: number) => T): T[] {
  return Array.from({
    length: faker.datatype.number({ min: nombreOccurrenceMin, max: nombreOccurrenceMax }),
  }).map((_, i) => entitéBuilder(i));
}

export function répéter(nombreOccurrenceMin: number, nombreOccurrenceMax: number, action: () => void) {
  for (let i = 0; i < faker.datatype.number({ min: nombreOccurrenceMin, max: nombreOccurrenceMax }); ++i) {
    action();
  }
}

export function générerPeutÊtreNull<T>(probabilitéNull: number, valeurSinon: T): T | null {
  return faker.datatype.number({ min: 0, max: 1, precision: 0.001 }) < probabilitéNull ? null : valeurSinon;
}
