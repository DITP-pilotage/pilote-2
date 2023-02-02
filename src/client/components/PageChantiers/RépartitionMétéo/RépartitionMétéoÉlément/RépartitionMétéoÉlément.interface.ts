import Météo from '@/server/domain/chantier/Météo.interface';

export default interface ÉlémentDeRépartitionDesMétéosProps {
  météo: Météo
  nombreDeChantiers: string
}
