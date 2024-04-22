import Axe from '@/server/domain/axe/Axe.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';

export default interface BarreLatéraleProps {
  ministères: Ministère[],
  axes: Axe[],
  afficherToutLesFiltres: boolean
}
