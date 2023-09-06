import { perimetre } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/fr';
import PérimètreMinistérielBuilder from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.builder';
import { générerPeutÊtreNull, générerUnLibellé } from '@/server/infrastructure/test/builders/utils';

type MinistèreDUnPérimètreMinistériel = { nom: perimetre['ministere'], id: perimetre['ministere_id'] };
export default class PérimètreMinistérielSQLRowBuilder {
  private _id: perimetre['id'];

  private _nom: perimetre['nom'];

  private _ministère: perimetre['ministere'];

  private _ministère_id: perimetre['ministere_id'];

  private _a_supprimer: perimetre['a_supprimer'];

  constructor() {
    const périmètreMinistérielGénéré = new PérimètreMinistérielBuilder().build();
    
    this._id = périmètreMinistérielGénéré.id;
    this._nom = périmètreMinistérielGénéré.nom;
    this._ministère = générerPeutÊtreNull(0.2, `${générerUnLibellé(1, 3)} ministère`);
    this._ministère_id = this._ministère ? `MIN-${faker.datatype.number()}` : null;
    this._a_supprimer = false;
  }

  avecId(id: perimetre['id']): PérimètreMinistérielSQLRowBuilder {
    this._id = id;
    return this;
  }

  avecNom(nom: perimetre['nom']): PérimètreMinistérielSQLRowBuilder {
    this._nom = nom;
    return this;
  }

  avecMinistère({ nom, id }: MinistèreDUnPérimètreMinistériel): PérimètreMinistérielSQLRowBuilder {
    this._ministère = nom;
    this._ministère_id = id;
    return this;
  }

  build(): perimetre {
    return {
      id: this._id,
      nom: this._nom,
      ministere: this._ministère,
      ministere_id: this._ministère_id,
      a_supprimer: this._a_supprimer,
    };
  }
}
