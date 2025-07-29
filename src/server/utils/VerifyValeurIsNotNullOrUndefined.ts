export const verifyValeurIsNotNullOrUndefined = (
  valeur: number | null | undefined,
): number | null => (valeur !== null && valeur !== undefined ? valeur : null);
