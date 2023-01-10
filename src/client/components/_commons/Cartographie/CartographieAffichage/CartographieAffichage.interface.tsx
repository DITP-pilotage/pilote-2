export type Territoire = { // TODO /!\ même nom côté back
  codeInsee: string,
  nom: string,
  // manque l'info : département ou région
};

export type TracéRégion = Territoire & {
  départementsÀTracer: (Territoire & {
    tracéSVG: string;
    codeInseeRégion: string;
  })[];
  tracéSVG: string;
};

export default interface CartographieAffichageProps {
  tracésRégions: TracéRégion[]
}
