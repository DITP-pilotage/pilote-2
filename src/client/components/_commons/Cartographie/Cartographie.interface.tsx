export type Territoire = {
  codeInsee: string,
  nom: string,
  // manque l'info : département ou région
};

export type TracéRégion = {
  départements: {
    tracéSVG: string;
    codeInsee: string;
    codeInseeRégion: string;
    nom: string;
  }[];
  tracéSVG: string;
  codeInsee: string;
  nom: string;
};

export type IdentifiantTerritoire = {
  codeInsee: Exclude<string, 'FR'>,
  divisionAdministrative: 'région' | 'département',
} | {
  codeInsee: 'FR',
  divisionAdministrative: 'france'
};

export default interface CartographieProps {
  zone: IdentifiantTerritoire,
  maille: 'régionale' | 'départementale',
}
