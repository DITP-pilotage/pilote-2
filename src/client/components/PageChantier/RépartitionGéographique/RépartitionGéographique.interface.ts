import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import Avancement from '@/server/domain/avancement/Avancement.interface';

export default interface CartesProps {
  avancementsGlobauxTerritoriaux: Record<Maille, Record<CodeInsee, {
    codeInsee: CodeInsee,
    avancementGlobal: Avancement['global'],
  }>>,
  météosTerritoriales: Record<Maille, Record<CodeInsee, {
    codeInsee: CodeInsee,
    météo: Météo,
  }>>
}
