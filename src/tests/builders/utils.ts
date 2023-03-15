import { faker } from '@faker-js/faker';

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
