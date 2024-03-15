import { SyntheseDesResultats } from '@/server/fiche-conducteur/domain/SyntheseDesResultats';
import { Meteo } from '@/server/fiche-conducteur/domain/Meteo';

export class SyntheseDesResultatsBuilder {
  private meteo: Meteo | null = 'COUVERT';

  private commentaire: string = 'Un commentaire de base';

  withMeteo(meteo: Meteo | null): SyntheseDesResultatsBuilder {
    this.meteo = meteo;
    return this;
  }

  withCommentaire(commentaire: string): SyntheseDesResultatsBuilder {
    this.commentaire = commentaire;
    return this;
  }

  build(): SyntheseDesResultats {
    return SyntheseDesResultats.creerSyntheseDesResultats({
      meteo: this.meteo,
      commentaire: this.commentaire,
    });
  }
}
