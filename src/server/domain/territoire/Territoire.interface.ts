import Avancement from '@/server/domain/avancement/Avancement.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';

export type CodeInsee = string;

export type Territoires = Record<CodeInsee, Territoire>;

export type Territoire = {
  codeInsee: CodeInsee,
  avancement: Avancement,
  météo: Météo,
};
