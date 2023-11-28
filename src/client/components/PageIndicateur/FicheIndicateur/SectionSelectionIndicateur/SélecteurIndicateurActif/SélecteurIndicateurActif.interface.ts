import { UseFormSetValue } from 'react-hook-form';
import {
  MetadataSelectionIndicateurForm,
} from '@/components/PageIndicateur/FicheIndicateur/SectionSelectionIndicateur/useSelectionIndicateurForm';

export default interface SélecteurIndicateurActif {
  etatIndicateurSélectionné: string
  setEtatIndicateurSélectionné: UseFormSetValue<MetadataSelectionIndicateurForm>
  estEnCoursDeModification: boolean
}
