import Chantier from '@/server/domain/chantier/Chantier.interface';

type ChantierInfo = Pick<Chantier, 'id' | 'nom' | 'id_périmètre' | 'météo' | 'avancement'>;

export default ChantierInfo;
