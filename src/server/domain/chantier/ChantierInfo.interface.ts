import Chantier from '@/server/domain/chantier/Chantier.interface';

type ChantierInfo = Pick<Chantier, 'id' | 'nom' | 'météo' | 'mailles' | 'périmètreIds'>;

export default ChantierInfo;
