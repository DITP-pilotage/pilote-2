export interface ChantierAvancementFront {
  annuel: number | null,
  global: number | null,
}

export default interface ChantierFront {
  id: string;
  nom: string;
  id_périmètre: string;
  météo: 1 | 2 | 3 | 4 | null;
  avancement: ChantierAvancementFront;
}
