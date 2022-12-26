import { faker } from '@faker-js/faker';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import Météo from '@/server/domain/chantier/Météo.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

const valeursMeteo = [null, 1, 2, 3, 4];

function générerIndicateurs(nombreIndicateurs: number) : Indicateur[] {
  const indicateurs: Indicateur[] = [];
  for (let i = 0;i < nombreIndicateurs;i++) {
    indicateurs.push({
      id: 'IND-' + ('' + i).padStart(3, '0'),
      nom: 'Indicateur ' + i,
      type: 'Type indicateur ' + i,
      estIndicateurDuBaromètre: i % 3 == 0,
      valeurInitiale: i % 2 == 0 ? null : faker.datatype.number(),
      valeurActuelle: i % 4 == 0 ? null : faker.datatype.number(),
      valeurCible: i % 5 == 0 ? null : faker.datatype.number(),
      tauxAvancementGlobal: i % 2 == 0 ? null : faker.datatype.number(),
    });
  }
  return indicateurs;
}

export function générerChantier(id: string): Chantier {
  const valeurs = Array.from({ length:8 }, () => faker.datatype.number({ min: 0, max: 100 }) / 100);
  valeurs.sort();
  const perimetreId = 'PER-' + faker.random.numeric(3);
  return {
    id,
    nom: faker.lorem.words(3),
    axe: { id: 'AXE-' + faker.random.alphaNumeric(3), nom: faker.lorem.words(3) },
    nomPPG: faker.lorem.words(3),
    id_périmètre: perimetreId,
    perimètreIds: [perimetreId],
    zoneNom: 'National',
    codeInsee: 'FR',
    météo: valeursMeteo[faker.datatype.number({ min: 0, max: 4 })] as Météo,
    avancement: {
      annuel: { minimum: valeurs[0], médiane: valeurs[2], moyenne: valeurs[4], maximum: valeurs[6] },
      global: { minimum: valeurs[1], médiane: valeurs[3], moyenne: valeurs[5], maximum: valeurs[7] },
    },
    indicateurs: générerIndicateurs(7),
  };
}

export default class ChantierRandomRepository implements ChantierRepository {

  async add(_: Chantier) {
    throw new Error('Error: Not implemented');
  }

  async getById(id: string) {
    return générerChantier(id);
  }

}
