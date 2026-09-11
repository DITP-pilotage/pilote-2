import { faker } from "@faker-js/faker/locale/fr";
import Objectif, {
  typesObjectif,
} from "@/server/domain/chantier/objectif/Objectif.interface";

export default class ObjectifBuilder {
  private _objectif: Objectif;

  constructor() {
    this._objectif = faker.helpers.arrayElement([
      this._générerUnObjectif(),
      null,
    ]);
  }

  private _générerUnObjectif() {
    return {
      id: faker.string.uuid(),
      type: faker.helpers.arrayElement(typesObjectif),
      contenu: faker.lorem.paragraph(),
      date: faker.date
        .recent({ days: 60, refDate: "2023-05-01T00:00:00.000Z" })
        .toISOString(),
      auteur: faker.helpers.arrayElement(["", faker.person.fullName()]),
    };
  }

  build(): Objectif {
    return this._objectif;
  }
}
