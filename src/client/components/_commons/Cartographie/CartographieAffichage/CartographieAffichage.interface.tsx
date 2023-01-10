import { FonctionDAffichage } from '@/components/_commons/Cartographie/Cartographie.interface';
export type Territoire = { // TODO /!\ même nom côté back
  codeInsee: string,
  nom: string,
  valeur: number | null,
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
  fonctionDAffichage: FonctionDAffichage
}
