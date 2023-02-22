import Ministère from '@/server/domain/ministère/Ministère.interface';
import { Axe } from '../../../../pages';

export default interface BarreLatéraleProps {
  ministères: Ministère[],
  axes: Axe[],
}
