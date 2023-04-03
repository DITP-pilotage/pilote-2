import { IndicateurData } from '@/server/import-indicateur/domain/IndicateurData';

export interface MesureIndicateurRepository {
  sauvegarder(listeIndicateursData: IndicateurData[]): Promise<void>;
}
