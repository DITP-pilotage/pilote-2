import { AvancementsStatistiques } from '@/components/_commons/Avancements/Avancements.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';

export default interface AvancementChantierProps {
  chantierId: Chantier['id']
  avancements: {
    nationale: AvancementsStatistiques
    départementale: { moyenne: number | null | undefined }
    régionale: { moyenne: number | null | undefined }
  } 
}
