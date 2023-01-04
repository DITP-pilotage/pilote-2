export type DépartementsType = {
  d: string,
  codeInsee: string,
  codeInseeRégion: string,
  nom: string,
}[];

export type RégionsType = {
  d: string,
  codeInsee: string,
  nom: string,
}[];

export default interface CartographieProps {
  territoire: {
    maille: 'france' | 'région' | 'département',
    codeInsee: string,
  }
}
