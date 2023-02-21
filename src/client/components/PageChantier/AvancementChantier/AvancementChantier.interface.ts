import AvancementsProps from '@/components/_commons/Avancements/Avancements.interface';

export default interface AvancementChantierProps {
  avancements: {
    nationale: AvancementsProps['avancements']
    départementale: { moyenne: number | null | undefined }
    régionale: { moyenne: number | null | undefined }
  } 
}
