import Chantier from '@/server/domain/chantier/Chantier.interface';

type ChantierInfo = Pick<Chantier, 'id' | 'nom' | 'météo' | 'avancement' | 'périmètreIds'>;

export default ChantierInfo;
