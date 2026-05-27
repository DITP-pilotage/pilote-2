export const widgetsSeed = [
  {
    publicId: 'WID-CARTE-DEPT',
    type: 'carte-france-departements',
    nom: 'Carte des départements',
    joinKey: 'codeInsee',
    defaultConfig: {},
    referentielPublicIds: ['REF-DEPT'],
  },
  {
    publicId: 'WID-CARTE-REG',
    type: 'carte-france-regions',
    nom: 'Carte des régions',
    joinKey: 'codeInsee',
    defaultConfig: {},
    referentielPublicIds: ['REF-REG'],
  },
] as const
