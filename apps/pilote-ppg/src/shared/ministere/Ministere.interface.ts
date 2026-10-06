import { PérimètreMinistériel } from "@/shared/perimetreMinisteriel/PerimetreMinisteriel.interface";

export interface Ministère {
  id: string;
  acronyme: string;
  nom: string;
  périmètresMinistériels: PérimètreMinistériel[];
  icône: string | null;
}
