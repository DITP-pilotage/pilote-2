import { ObjectifType } from '@/server/fiche-conducteur/domain/ObjectifType';
import { Objectif } from '@/server/fiche-conducteur/domain/Objectif';

export class ObjectifBuilder {
  private type: ObjectifType = 'a_faire';

  private contenu: string = 'un contenu pour un objectif';

  withType(type: ObjectifType): ObjectifBuilder {
    this.type = type;
    return this;
  }

  withContenu(contenu: string): ObjectifBuilder {
    this.contenu = contenu;
    return this;
  }

  build(): Objectif {
    return Objectif.creerObjectif({
      type: this.type,
      contenu: this.contenu,
    });
  }
}
