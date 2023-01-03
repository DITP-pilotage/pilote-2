import { faker } from '@faker-js/faker';

export function générerUnIdentifiantUnique(prefixe: string) {
  return `${prefixe}-${faker.helpers.unique(faker.random.numeric, [3])}`;
}

export function générerCaractèresSpéciaux(nombre: number) {
  const caractères = ['/', ':', '@', '[', ']', '#', 'é'];
  return Array.from({ length: nombre })
    .map(() => caractères[Math.floor(Math.random() * caractères.length)])
    .join('');
}
