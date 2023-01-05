import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import Météo from './Météo.interface';

export type Axe = { id: string, nom: string } | null;

export type Avancement = {
  global: number | null
  annuel: number | null
};

export type NomDeMaille = 'nationale' | 'régionale' | 'départementale';

export type Maille = Record<string, {
  codeInsee: string,
  avancement: Avancement,
}>;

export default interface Chantier {
  id: string;
  nom: string;
  axe: Axe;
  nomPPG: string | null;
  périmètreIds: string[];
  mailles: Record<NomDeMaille, Maille>;
  météo: Météo;
  avancement: Avancement;
  indicateurs: Indicateur[];
}

export function ajouteValeurDeMaille(chantier: Chantier, nomDeMaille: NomDeMaille, valeur: { avancement: Avancement; codeInsee: string }) {
  if (!chantier.mailles[nomDeMaille]) {
    chantier.mailles[nomDeMaille] = {};
  }
  const maille = chantier.mailles[nomDeMaille];
  maille[valeur.codeInsee] = valeur;
}
