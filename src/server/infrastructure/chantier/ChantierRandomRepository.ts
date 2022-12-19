import { faker } from '@faker-js/faker';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import Météo from '@/server/domain/chantier/Météo.interface';

// Crapy function to please the type system
function numberToMétéo(n: number): Météo {
  if (n < 2) {
    return 2;
  }
  if (n < 5) {
    return 4;
  }
  return null;
}

function fakePercentage(): number {
  return faker.datatype.number({ min: 0, max: 100 }) / 100 ;
}

export default class ChantierRandomRepository implements ChantierRepository {

  async add(_: Chantier) {
    throw new Error('Error: Not implemented');
  }

  async getById(id: string) {
    const valeurs = [fakePercentage(), fakePercentage(), fakePercentage(), fakePercentage(), fakePercentage(), fakePercentage(), fakePercentage(), fakePercentage()];
    valeurs.sort();
    return {
      id,
      nom: faker.lorem.words(3),
      axe: { id: 'AXE-' + faker.random.alphaNumeric(3), nom: faker.lorem.words(3) },
      nomPPG: faker.lorem.words(3),
      id_périmètre: 'PER-' + faker.random.numeric(3),
      météo: numberToMétéo(faker.datatype.number({ min: 1, max: 4 })),
      avancement: {
        annuel: { minimum: valeurs[0], médiane: valeurs[2], moyenne: valeurs[4], maximum: valeurs[6] },
        global: { minimum: valeurs[1], médiane: valeurs[3], moyenne: valeurs[5], maximum: valeurs[7] },
      },
      indicateurs: [],
    };
  }
}
