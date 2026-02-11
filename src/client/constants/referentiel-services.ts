import referentielData from "./referentiel-services.json";

export interface ServiceReferentiel {
  slug: string;
  libelle: string;
}

export interface MinistereReferentiel {
  slug: string;
  libelle: string;
  services: ServiceReferentiel[];
}

export const referentielServices = referentielData as {
  ministeres: MinistereReferentiel[];
};

export const ministereSlugs = referentielServices.ministeres.map((m) => m.slug);

export function getServicesForMinistere(
  ministereSlug: string,
): ServiceReferentiel[] {
  const ministere = referentielServices.ministeres.find(
    (m) => m.slug === ministereSlug,
  );
  return ministere?.services ?? [];
}
