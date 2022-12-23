import { faker } from '@faker-js/faker';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import Météo from '@/server/domain/chantier/Météo.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import Type from '@/server/domain/indicateur/Type.interface';

const valeursMeteo: Météo[] = [null, 1, 2, 3, 4];
const valeursTypeIndicateur: Type[] = ['CONTEXTE', 'DÉPLOIEMENT', 'IMPACT', 'QUALITÉ_DE_SERVICE', 'SUIVI_EXTERNALITÉS_ET_EFFET_REBOND'];

function générerIndicateurs(nombreIndicateurs: number) : Indicateur[] {
  const indicateurs: Indicateur[] = [];
  for (let i = 0;i < nombreIndicateurs;i++) {
    indicateurs.push({
      id: 'IND-' + ('' + i).padStart(3, '0'),
      nom: 'Indicateur ' + i,
      type: valeursTypeIndicateur[faker.datatype.number({ min: 0, max: valeursTypeIndicateur.length - 1 })],
      estIndicateurDuBaromètre: i % 3 == 0,
      valeurInitiale: i % 2 == 0 ? null : faker.datatype.number(),
      valeurActuelle: i % 4 == 0 ? null : faker.datatype.number(),
      valeurCible: i % 5 == 0 ? null : faker.datatype.number(),
      tauxAvancementGlobal: i % 2 == 0 ? null : faker.datatype.float({ min:0, max:1 }),
    });
  }
  return indicateurs;
}

export function générerChantier(id: string, zone_nom: string): Chantier {
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
    zoneNom: zone_nom,
    codeInsee: 'FR',
    maille: 'NAT',
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

  async getById(id: string, zone_nom: string) {
    return générerChantier(id, zone_nom);
  }

}
