import Chantier from '@/server/domain/chantier/Chantier.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';

export const scopes = ['lecture', 'saisie.commentaire', 'saisie.indicateur'] as const;
export type Scope = typeof scopes[number];

type Habilitation = {
  chantiers: Chantier['id'][]
  territoires: string[]
};

export type Habilitations = {
  [key in Scope]: Habilitation
};

export type HabilitationsÀCréerOuMettreÀJour = Record<Scope, Habilitation & { périmètres: PérimètreMinistériel['id'][] }>;
