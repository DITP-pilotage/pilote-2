import { Météo } from '@/server/domain/météo/Météo.interface';

const météos: Record<Météo, string> = {
  'ORAGE': 'Objectifs compromis',
  'NUAGE': 'Appuis nécessaires',
  'COUVERT': 'Objectifs atteignables',
  'SOLEIL': 'Objectifs sécurisés',
  'NON_NECESSAIRE': 'Non nécessaire',
  'NON_RENSEIGNEE': 'Non renseignée',
};

export default météos;
