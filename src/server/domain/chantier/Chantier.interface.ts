import Météo from './Météo.interface';

export type Axe = { id: string, nom: string } | null;

export type Avancement = {
  global: number | null
  annuel: number | null
};

export const mailles = ['nationale', 'régionale', 'départementale'] as const;

export type Maille = typeof mailles[number];

export type Territoire = {
  codeInsee: string,
  avancement: Avancement,
  météo: Météo,
};

export type Territoires = Record<string, Territoire>;

export type DirecteurAdministrationCentrale = { nom: string, direction: string };
export type Contact = { nom: string, email: string | null };

export default interface Chantier {
  id: string;
  nom: string;
  axe: Axe;
  nomPPG: string | null;
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
