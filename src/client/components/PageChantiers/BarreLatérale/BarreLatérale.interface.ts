import { Ministère } from '@/components/PageChantiers/BarreLatérale/FiltresMinistères/FiltresMinistères.interface';

export default interface BarreLatéraleProps {
  estOuvert: boolean,
  setEstOuvert: (state: boolean) => void,
  ministères: Ministère[],
}
