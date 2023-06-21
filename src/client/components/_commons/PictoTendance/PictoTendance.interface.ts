import { ChantierTendance } from '@/server/domain/chantier/Chantier.interface';

export type Tendance = ChantierTendance;

export default interface PictoTendanceProps {
  tendance: Tendance;
}
