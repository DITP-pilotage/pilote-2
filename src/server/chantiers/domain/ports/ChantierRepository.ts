import { DonneeChantier } from '@/server/chantiers/domain/DonneeChantier';

export interface ChantierRepository {
  récupérerDonneesChantier(chantierId: string, territoireCodesLecture: string[]): Promise<DonneeChantier[]>;
}
