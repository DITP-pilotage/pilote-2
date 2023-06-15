import { TypeDeRéforme } from '@/client/stores/useTypeDeRéformeStore/useTypedeRéformeStore.interface';

export default interface SélecteurTypeDeRéformeProps {
  typeDeRéformeSélectionné: TypeDeRéforme
  modifierTypeDeRéformeSélectionné: () => void
}
