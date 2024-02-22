import { Chantier } from '@/server/fiche-territoriale/domain/Chantier';

export interface ChantierRepository {
  listerParTerritoireCodePourUnDepartement: ({ territoireCode }: { territoireCode: string }) => Promise<Chantier[]>
  listerParTerritoireCodePourUneRegion: ({ territoireCode }: { territoireCode: string }) => Promise<Chantier[]>
}
