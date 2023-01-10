export type TracéRégionJSON = {
  tracéSVG: string,
  codeInsee: string,
  nom: string
}[];

export type TerritoireAffiché = {
  codeInsee: Exclude<string, 'FR'>,
  divisionAdministrative: 'région',
} | {
  codeInsee: 'FR',
  divisionAdministrative: 'france'
};

export default interface CartographieProps {
  territoireAffiché: TerritoireAffiché,
  niveauDeMailleAffiché: 'régionale' | 'départementale',
}
