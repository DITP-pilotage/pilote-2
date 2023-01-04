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

export enum Maille {
  FRANCE = 'france',
  RÉGION = 'région',
  DÉPARTEMENT = 'département',
}

export default interface CartographieProps {
  territoire: {
    maille: Maille,
    codeInsee: string,
  }
}
