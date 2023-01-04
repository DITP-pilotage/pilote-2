export type DépartementsType = {
  d: string,
  département: string,
  région: string,
  nom: string,
}[];

export type RégionsType = {
  d: string,
  région: string,
  nom: string,
}[];

export default interface CartographieProps {
  territoire: {
    maille: 'france' | 'région' | 'département',
    codeInsee: string,
  }
}
