export function filtrerHallucinations<TItem, TReference>({
  items,
  references,
  getId,
}: {
  items: TItem[];
  references: Map<string, TReference>;
  getId: (item: TItem) => string;
}): TReference[] {
  return items.flatMap((item) => {
    const reference = references.get(getId(item));
    return reference === undefined ? [] : [reference];
  });
}
