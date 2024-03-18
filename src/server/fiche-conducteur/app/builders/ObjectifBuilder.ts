import { ObjectifType } from '@/server/fiche-conducteur/domain/ObjectifType';
import { Objectif } from '@/server/fiche-conducteur/domain/Objectif';

export class ObjectifBuilder {
  private type: ObjectifType = 'a_faire';

  private contenu: string = 'un contenu pour un objectif';

  private date: string = '2022-05-01T00:00:00.000Z';

  withType(type: ObjectifType): ObjectifBuilder {
    this.type = type;
    return this;
  }

  withContenu(contenu: string): ObjectifBuilder {
    this.contenu = contenu;
    return this;
  }

  withDate(date: string) {
    this.date = date;
    return this;

  }

  build(): Objectif {
    return Objectif.creerObjectif({
      date: this.date,
      type: this.type,
      contenu: this.contenu,
    });
  }
}
