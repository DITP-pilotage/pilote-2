import { AvancementsStatistiques } from '@/components/_commons/Avancements/Avancements.interface';

export default interface AvancementChantierProps {
  avancements: {
    nationale: AvancementsStatistiques
    départementale: { moyenne: number | null | undefined }
    régionale: { moyenne: number | null | undefined }
  } 
}
