export const widgetsSeed = [
  {
    publicId: 'WID-CARTE-DEPT',
    type: 'carte-france-departements',
    nom: 'Carte des départements',
    joinKey: 'codeInsee',
    referentielPublicIds: ['REF-DEPT'],
  },
  {
    publicId: 'WID-CARTE-REG',
    type: 'carte-france-regions',
    nom: 'Carte des régions',
    joinKey: 'codeInsee',
    referentielPublicIds: ['REF-REG'],
  },
] as const
