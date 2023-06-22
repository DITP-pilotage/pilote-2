import { Rubrique } from '@/client/utils/rubriques';

export default interface SommaireProps {
  rubriques: Rubrique[];
  auClic?: () => void;
}
