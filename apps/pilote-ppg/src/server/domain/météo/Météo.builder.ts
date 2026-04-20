import { faker } from "@faker-js/faker/locale/fr";
import { Meteo, meteos } from "@/server/domain/météo/Météo.interface";

export default class MétéoBuilder {
  private readonly _météo: Meteo;

  constructor() {
    this._météo = faker.helpers.arrayElement(meteos);
  }

  build(): Meteo {
    return this._météo;
  }
}
