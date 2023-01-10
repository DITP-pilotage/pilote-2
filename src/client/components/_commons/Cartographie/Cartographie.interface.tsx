export type Territoire = {
  codeInsee: string,
  nom: string,
  // manque l'info : département ou région
};

export type TracéRégion = Territoire & {
  départements: (Territoire & {
    tracéSVG: string;
    codeInseeRégion: string;
  })[];
  tracéSVG: string;
};

export type PérimètreTerritorial = {
  codeInsee: Exclude<string, 'FR'>,
  divisionAdministrative: 'région',
} | {
  codeInsee: 'FR',
  divisionAdministrative: 'france'
};

export default interface CartographieProps {
  périmètreTerritorial: PérimètreTerritorial,
  maille: 'régionale' | 'départementale',
}
