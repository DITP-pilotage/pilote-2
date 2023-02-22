import Ministère from '@/server/domain/ministère/Ministère.interface';
import { Axe, Ppg } from '@/server/domain/chantier/Chantier.interface';

export default interface BarreLatéraleProps {
  ministères: Ministère[],
  axes: Axe[],
  ppg: Ppg[]
}
