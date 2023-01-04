export type Département = {
  d: string,
  codeInsee: string,
  codeInseeRégion: string,
  nom: string,
};

export type Région = {
  d: string,
  codeInsee: string,
  nom: string,
};

export type Territoire = Département | Région;

export default interface CartographieProps {
  territoire: {
    maille: 'france' | 'région' | 'département',
    codeInsee: string,
  }
}
