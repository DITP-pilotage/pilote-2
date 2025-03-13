import Chantier from '@/server/domain/chantier/Chantier.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';

export const scopesUtilisateurs = ['gestionUtilisateur'] as const;
export const scopesChantiers = ['lecture', 'saisieCommentaire', 'saisieIndicateur', 'responsabilite'] as const;

export type ScopeUtilisateurs = typeof scopesUtilisateurs[number];
export type ScopeChantiers = typeof scopesChantiers[number];

type MetaInformation = {
  aAccesTousLesChantiers: boolean
  aAccesTousLesTerritoires: boolean
  aAccesTousLesPerimetres: boolean
};

export type HabilitationChantiers = {
  __meta: MetaInformation
  chantiers: Chantier['id'][]
  territoires: string[]
  périmètres: PérimètreMinistériel['id'][]
};

type HabilitationUtilisateurs = {
  __meta: MetaInformation
  chantiers: Chantier['id'][]
  territoires: string[]
  périmètres: PérimètreMinistériel['id'][]
};


export type Habilitations = Record<ScopeUtilisateurs, HabilitationUtilisateurs>
& Record<ScopeChantiers, HabilitationChantiers>;

export type HabilitationsÀCréerOuMettreÀJour = {
  lecture: {
    chantiers: Chantier['id'][]
    territoires: Territoire['code'][]
    périmètres: PérimètreMinistériel['id'][]
  },
  responsabilite: {
    chantiers: Chantier['id'][]
  }
};
