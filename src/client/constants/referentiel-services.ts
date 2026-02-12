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
