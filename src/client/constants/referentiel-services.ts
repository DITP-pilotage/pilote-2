import referentielData from "./referentiel-services.json";

export interface ServiceReferentiel {
  slug: string;
  libelle: string;
}

export interface PerimetreMinisterielReferentiel {
  slug: string;
  libelle: string;
  services: ServiceReferentiel[];
}

export const referentielServices = referentielData as {
  perimetresMinisteriels: PerimetreMinisterielReferentiel[];
};

export const getPerimetreLibelle = (slug: string | null): string | null => {
  if (!slug) return null;
  const perimetre = referentielServices.perimetresMinisteriels.find(
    (p) => p.slug === slug,
  );
  return perimetre?.libelle ?? null;
};

export const getServiceLibelle = (
  perimetreSlug: string | null,
  serviceSlug: string | null,
  serviceAutre: string | null,
): string | null => {
  if (!serviceSlug) return null;
  if (serviceSlug === "autre") return serviceAutre;
  if (!perimetreSlug) return null;

  const perimetre = referentielServices.perimetresMinisteriels.find(
    (p) => p.slug === perimetreSlug,
  );
  const service = perimetre?.services.find((s) => s.slug === serviceSlug);
  return service?.libelle ?? null;
};
