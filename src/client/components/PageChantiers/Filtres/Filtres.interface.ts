import Axe from '@/server/domain/axe/Axe.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Ppg from '@/server/domain/ppg/Ppg.interface';

export default interface BarreLatéraleProps {
  ministères: Ministère[],
  axes: Axe[],
  ppg: Ppg[]
}
