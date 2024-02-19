import { SyntheseDesResultats } from '@/server/fiche-territoriale/domain/SyntheseDesResultats';

export class SyntheseDesResultatsBuilder {
  private dateMeteo: string = '2019-02-02T00:00:00.000Z';

  private dateCommentaire: string = '2013-02-02T00:00:00.000Z';

  withDateMeteo(dateMeteo: string): SyntheseDesResultatsBuilder {
    this.dateMeteo = dateMeteo;
    return this;
  }

  withDateCommentaire(dateCommentaire: string): SyntheseDesResultatsBuilder {
    this.dateCommentaire = dateCommentaire;
    return this;
  }

  build(): SyntheseDesResultats {
    return SyntheseDesResultats.creerSyntheseDesResultats({
      dateMeteo: this.dateMeteo,
      dateCommentaire: this.dateCommentaire,
    });
  }
}
