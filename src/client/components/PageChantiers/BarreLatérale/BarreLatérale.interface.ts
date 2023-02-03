import Ministère from '@/server/domain/ministère/Ministère.interface';

export default interface BarreLatéraleProps {
  estOuvert: boolean,
  setEstOuvert: (state: boolean) => void,
  ministères: Ministère[],
}
