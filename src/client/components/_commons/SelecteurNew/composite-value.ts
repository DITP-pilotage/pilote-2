const COMPOSITE_SEPARATOR = "--";

export function buildCompositeValue(
  groupValue: string,
  itemValue: string,
): string {
  return `${groupValue}${COMPOSITE_SEPARATOR}${itemValue}`;
}

export function parseCompositeValue(compositeValue: string): string {
  return compositeValue.includes(COMPOSITE_SEPARATOR)
    ? compositeValue
        .split(COMPOSITE_SEPARATOR)
        .slice(1)
        .join(COMPOSITE_SEPARATOR)
    : compositeValue;
}

export function buildCompositeSelectedValue(
  groupValue: string | null,
  itemValue: string | null,
): string | undefined {
  return groupValue && itemValue
    ? buildCompositeValue(groupValue, itemValue)
    : undefined;
}
