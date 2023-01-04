export function normaliserChaîneDeCaractères(chaîneDeCaractères: string) {
  return chaîneDeCaractères
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036F]/g, ''); // Enlève les diacritiques
}
