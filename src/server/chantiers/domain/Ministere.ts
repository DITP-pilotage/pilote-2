import { PerimetreMinisteriel } from '@/server/chantiers/domain/PerimetreMinisteriel';

export interface Ministere {
  id: string;
  acronyme: string;
  nom: string;
  périmètresMinistériels: PerimetreMinisteriel[];
  icône: string | null;
}
