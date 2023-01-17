import { Territoire } from '@/server/domain/chantier/Chantier.interface';
import { météoFromString } from '@/server/domain/chantier/Météo.interface';

export class DonnéesTerritoireBuilder {
  private data: Record<string, Territoire> = {};

  withAvancementGlobal(codeInsee: string, avancementGlobal: number) {
    this.data[codeInsee] = {
      codeInsee,
      avancement: { annuel: null, global: avancementGlobal },
      météo: météoFromString('SOLEIL'),
    };

    return this;
  }

  build(): Record<string, Territoire> {
    return this.data;
  }
}
