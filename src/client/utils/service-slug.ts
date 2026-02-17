const COMPOSITE_SEPARATOR = "--";

export function buildCompositeServiceSlug(
  perimetreSlug: string,
  serviceSlug: string,
): string {
  return `${perimetreSlug}${COMPOSITE_SEPARATOR}${serviceSlug}`;
}

export function parseCompositeServiceSlug(compositeSlug: string): string {
  return compositeSlug.includes(COMPOSITE_SEPARATOR)
    ? compositeSlug.split(COMPOSITE_SEPARATOR).slice(1).join(COMPOSITE_SEPARATOR)
    : compositeSlug;
}

export function buildValeurSelectionnee(
  perimetreMinisteriel: string | null,
  service: string | null,
): string | undefined {
  return perimetreMinisteriel && service
    ? buildCompositeServiceSlug(perimetreMinisteriel, service)
    : undefined;
}
