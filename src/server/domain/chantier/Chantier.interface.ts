import ChantierAvancement from './ChantierAvancement.interface';

export type Météo = 1 | 2 | 3 | 4 | null;

export default interface Chantier {
  id: string;
  nom: string;
  id_périmètre: string;
  météo: Météo;
  avancement: ChantierAvancement;
}
