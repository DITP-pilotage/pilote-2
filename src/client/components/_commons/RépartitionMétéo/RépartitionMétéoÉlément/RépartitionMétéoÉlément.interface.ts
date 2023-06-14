import { TypeDeRéforme } from '@/client/stores/useTypeDeRéformeStore/useTypedeRéformeStore.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';

export default interface RépartitionMétéosÉlémentProps {
  météo: Météo
  nombreDeChantiers: string
}

export interface RépartitionMétéosÉlémentStyledProps {
  typeDeRéforme: TypeDeRéforme
}
