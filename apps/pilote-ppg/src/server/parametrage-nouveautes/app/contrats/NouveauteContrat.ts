import { Nouveaute } from "@/server/parametrage-nouveautes/domain/Nouveaute";

export type NouveauteContrat = {
  id: string;
  version: string;
  date: string;
  contenu: string;
};

export const presenterEnNouveauteContrat = (
  nouveaute: Nouveaute,
): NouveauteContrat => {
  return {
    id: nouveaute.id,
    version: nouveaute.version,
    date: nouveaute.date,
    contenu: nouveaute.contenu,
  };
};

export const presenterEnListeNouveauteContrat = (
  nouveautes: Nouveaute[],
): NouveauteContrat[] => {
  return nouveautes.map(presenterEnNouveauteContrat);
};
