import { InformationIndicateur } from '@/server/import-indicateur/domain/InformationIndicateur';


export interface InformationIndicateurContrat {
  indicId: string,
  indicSchema: string,
}

export function presenterEnInformationIndicateurContrat(informationIndicateur: InformationIndicateur): InformationIndicateurContrat {
  return {
    indicId: informationIndicateur.indicId,
    indicSchema: informationIndicateur.indicSchema,
  };
}
