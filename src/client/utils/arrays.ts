export function groupBy<T>(arr: T[], fn: (item: T) => any) {
  // eslint-disable-next-line unicorn/no-array-reduce
  return arr.reduce<Record<string, T[]>>((prev, curr) => {
    const groupKey = fn(curr);
    const group = prev[groupKey] || [];
    group.push(curr);
    return { ...prev, [groupKey]: group };
  }, {});
}

export function groupByAndTransform<T, U>(arr: T[], fn: (item: T) => any, transformFn: (item: T) => U) {
  // eslint-disable-next-line unicorn/no-array-reduce
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
