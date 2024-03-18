import { Chantier } from '@/server/fiche-conducteur/domain/Chantier';

export interface ChantierRepository {
  récupérerParIdEtParTerritoireCode({ chantierId, territoireCode }: { chantierId: string, territoireCode: string }): Promise<Chantier>
  récupérerMailleNatEtDeptParId(chantierId: string): Promise<Chantier[]>
}
