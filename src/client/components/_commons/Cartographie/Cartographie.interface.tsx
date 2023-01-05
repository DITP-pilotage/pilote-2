export type Territoire = {
  codeInsee: string,
  nom: string,
  // manque l'info : département ou région
};

export type TracéDépartement = Territoire & {
  tracéSVG: string,
  codeInseeRégion: string,
};

export type TracéRégion = Territoire & {
  tracéSVG: string,
};

export type TracéTerritoire = TracéDépartement | TracéRégion;

export type IdentifiantTerritoire = {
  codeInsee: Exclude<string, 'FR'>,
  divisionAdministrative: 'région' | 'département',
} | {
  codeInsee: 'FR',
  divisionAdministrative: 'france'
};

export default interface CartographieProps {
  zone: IdentifiantTerritoire
}
