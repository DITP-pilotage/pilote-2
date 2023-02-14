import Météo from './Météo.interface';

export type Avancement = {
  global: number | null
  annuel: number | null
};

export const maillesInternes = ['régionale', 'départementale'] as const;
export const mailles = ['nationale', ...maillesInternes] as const;
export type Maille = typeof mailles[number];
export type MailleInterne = typeof maillesInternes[number];

export const libellésMailles: Record<Maille, string> = {
  'nationale': 'Nationale',
  'régionale': 'Régionale',
  'départementale': 'Départementale',
};

// le code INSEE seul ne suffit pas à distinguer un territoire d'un autre
// il faut le combiner avec la notion de maille (département, région)
export type TerritoireIdentifiant = {
  codeInsee: string,
  maille: Maille,
  codeInseeRégion?: string
};

export type Territoire = {
  codeInsee: string,
  avancement: Avancement,
  météo: Météo,
};

export type Territoires = Record<string, Territoire>;

export type DirecteurAdministrationCentrale = { nom: string, direction: string };
export type Contact = { nom: string, email: string | null };

export type ChantierTerritorialisé = {
  id: string;
  nom: string;
  avancementGlobalTerritoire: Avancement['global'];
  météoTerritoire: Météo;
  estBaromètre: boolean
  territoire: TerritoireIdentifiant & { nom: string | undefined }
};
export default interface Chantier {
  id: string;
  nom: string;
  axe: string | null;
  ppg: string | null;
  périmètreIds: string[];
  mailles: Record<Maille, Territoires>;
  responsables: {
    porteur: string,
    coporteurs: string[],
    directeursAdminCentrale: DirecteurAdministrationCentrale[],
    directeursProjet: Contact[]
  }
  estBaromètre: boolean;
}

