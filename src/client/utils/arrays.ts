export function groupBy<T>(arr: T[], fn: (item: T) => any, init: Record<string, T[]> = {}) {
  return arr.reduce<Record<string, T[]>>((prev, curr) => {
    const groupKey = fn(curr);
    const group = prev[groupKey] || [];
    group.push(curr);
    return { ...prev, [groupKey]: group };
  }, init);
}

export function groupByAndTransform<T, U>(arr: T[], fn: (item: T) => any, transformFn: (item: T) => U) {
  return arr.reduce<Record<string, U[]>>((prev, curr) => {
    const groupKey = fn(curr);
    const group = prev[groupKey] || [];
    group.push(transformFn(curr));
    return { ...prev, [groupKey]: group };
  }, {});
}

export function deuxTableauxSontIdentiques(tableau1: string[], tableau2: string[]) {
  if (tableau1.length !== tableau2.length)
    return false;
  
  for (const element of tableau1) {
    if (!tableau2.includes(element)) {
      return false;
    }
  }

  return true;
}

export function toutesLesValeursDuTableauSontContenuesDansLAutreTableau(tableauContenu: (string | number | boolean | null)[], tableauContenant: (string | number | boolean | null)[]) {
  return tableauContenu.every(element => tableauContenant.includes(element));
}

export function auMoinsUneValeurDuTableauEstContenueDansLAutreTableau(tableau1: (string | number | boolean | null)[], tableau2: (string | number | boolean | null)[]) {
  return tableau1.some(element => tableau2.includes(element));
}

export function trierParOrdreAlphabétique<T extends Record<string, any>[]>(tableau: T, propriétéDeTri: string) {
  return tableau.sort((a, b) => a[propriétéDeTri].localeCompare(b[propriétéDeTri], 'fr'));
}
