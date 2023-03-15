import Objectif from '@/server/domain/objectif/Objectif.interface';
import ObjectifRepository from '@/server/domain/objectif/ObjectifRepository.interface';

export default class ObjectifRandomRepository implements ObjectifRepository {
  async récupérerLePlusRécent(_chantierId: string): Promise<Objectif> {
    return {
      contenu: 'contenu objectif',
      auteur: 'auteur objectif',
      date: '2011-10-05T14:48:00.000',
    };
  }
}
