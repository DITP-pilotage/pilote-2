import { MultiSelectOptionGroupée } from '@/components/_commons/MultiSelect/MultiSelect.interface';

export default interface MultiSelectGroupeProps {
  groupeOptions: MultiSelectOptionGroupée
  changementÉtatCallback: (valeur: string) => void
  valeursSélectionnées: Set<string>
}
