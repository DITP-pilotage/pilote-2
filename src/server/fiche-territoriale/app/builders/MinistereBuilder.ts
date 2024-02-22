import { Ministere } from '@/server/fiche-territoriale/domain/Ministere';

export class MinistereBuilder {
  private icone: string = 'une-icone';

  private code: string = '1009';

  withIcone(icone: string): MinistereBuilder {
    this.icone = icone;
    return this;
  }

  withCode(code: string): MinistereBuilder {
    this.code = code;
    return this;
  }

  build(): Ministere {
    return Ministere.creerMinistere({ icone: this.icone, code: this.code });
  }
}
