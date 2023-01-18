export default function essayer<T>(
  valeur: () => T,
  valeurDeRepli: T,
) {
  try {
    return valeur();
  } catch {
    return valeurDeRepli;
  }
}
