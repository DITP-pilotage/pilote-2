import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import Avancement from '@/server/domain/avancement/Avancement.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';

export type DonnéesTerritoriales = {
  codeInsee: CodeInsee,
  avancement: Avancement,
  météo: Météo,
};
