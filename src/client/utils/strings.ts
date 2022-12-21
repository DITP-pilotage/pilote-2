export function normaliserChaîneDeCaractères(chaîneDeCaractères: string) {
  return chaîneDeCaractères
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036F]/g, ''); // Enlève les diacritiques
}

export function générerCaractèresSpéciaux(nombre: number) {
  const caractères = ['/', ':', '@', '[', ']', '#', 'é'];
  return Array.from({ length: nombre })
    .map(() => caractères[Math.floor(Math.random() * caractères.length)])
    .join('');
}
