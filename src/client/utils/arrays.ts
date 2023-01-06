export function groupBy<T>(arr: T[], fn: (item: T) => any) {
  // eslint-disable-next-line unicorn/no-array-reduce
  return arr.reduce<Record<string, T[]>>((prev, curr) => {
    const groupKey = fn(curr);
    const group = prev[groupKey] || [];
    group.push(curr);
    return { ...prev, [groupKey]: group };
  }, {});
}
