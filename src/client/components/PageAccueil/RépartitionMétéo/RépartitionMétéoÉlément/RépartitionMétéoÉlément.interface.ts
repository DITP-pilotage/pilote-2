import { Météo } from '@/server/domain/météo/Météo.interface';

export default interface ÉlémentDeRépartitionDesMétéosProps {
  météo: Météo
  nombreDeChantiers: string
}
