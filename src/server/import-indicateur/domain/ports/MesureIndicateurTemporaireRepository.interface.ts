import { MesureIndicateurTemporaire } from '@/server/import-indicateur/domain/MesureIndicateurTemporaire';

export interface MesureIndicateurTemporaireRepository {
  recupererToutParRapportId(rapportId: string): Promise<MesureIndicateurTemporaire[]>;

  supprimerToutParRapportId(rapportId: string): Promise<void>;

  sauvegarder(listeMesuresIndicateursTemporaire: MesureIndicateurTemporaire[]): Promise<void>;
}
