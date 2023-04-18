import { TypeObjectif } from '@/server/domain/objectif/Objectif.interface';

const libellésTypesObjectif: Record<TypeObjectif, string> = {
  notreAmbition: 'Notre ambition',
  déjàFait: 'Ce qui a déjà été fait',
  àFaire: 'Ce qui reste à faire',
};

export default libellésTypesObjectif;
