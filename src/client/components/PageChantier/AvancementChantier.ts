import { AvancementsStatistiques } from '@/components/_commons/Avancements/Avancements.interface';

export type AvancementChantierContrat = {
  nationale: AvancementsStatistiques
  departementale: {
    global: {
      moyenne: number | null
    },
    annuel: {
      moyenne: number | null
    },
  }
  regionale: {
    global: {
      moyenne: number | null
    },
    annuel: {
      moyenne: number | null
    },
  }
};
