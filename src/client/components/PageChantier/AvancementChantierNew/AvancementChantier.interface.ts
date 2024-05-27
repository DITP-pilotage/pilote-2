import { AvancementsStatistiques } from '@/components/_commons/Avancements/Avancements.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';

export default interface AvancementChantierProps {
  chantierId: Chantier['id']
  avancements: {
    nationale: AvancementsStatistiques
    départementale: { 
      global: {
        moyenne?: number | null
      },
      annuel: {
        moyenne?: number | null
      },
    }
    régionale: { 
      global: {
        moyenne?: number | null
      },
      annuel: {
        moyenne?: number | null
      },
    }
  } 
}
