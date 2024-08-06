import { AvancementsStatistiques } from '@/components/_commons/Avancements/Avancements.interface';

export type AvancementChantierContrat = {
  nationale: AvancementsStatistiques
  départementale: {
    global: {
      moyenne: number | null
    },
    annuel: {
      moyenne: number | null
    },
  }
  régionale: {
    global: {
      moyenne: number | null
    },
    annuel: {
      moyenne: number | null
    },
  }
};
