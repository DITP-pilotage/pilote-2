import { randomUUID } from 'node:crypto';
import { HistorisationModification } from '@/server/domain/historisationModification/HistorisationModification';
import {
  HistorisationModificationDisponible,
} from '@/server/infrastructure/accès_données/historisationModification/HistorisationModificationDisponible';

export class HistorisationModificationCreationBuilder {
  private id: string = randomUUID();

  private tableModifieId: keyof HistorisationModificationDisponible = 'metadata_indicateurs';

  private nouvelleValeur: object = {};
  
  private utilisateurNom: string = 'utilisateurNom';


  withId(id: string) {
    this.id = id;
    return this;
  }

  withUtilisateurNom(utilisateurNom: string) {
    this.utilisateurNom = utilisateurNom;
    return this;
  }

  withTableModifieId(tableModifieId: keyof HistorisationModificationDisponible) {
    this.tableModifieId = tableModifieId;
    return this;
  }

  withNouvelleValeur(nouvelleValeur: object) {
    this.nouvelleValeur = nouvelleValeur;
    return this;
  }

  build<K extends keyof HistorisationModificationDisponible>(): HistorisationModification<K> {
    return HistorisationModification.creerHistorisationCreation<K>({
      id: this.id,
      utilisateurNom: this.utilisateurNom,
      tableModifieId: this.tableModifieId as K,
      nouvelleValeur: this.nouvelleValeur as HistorisationModificationDisponible[K],
    });
  }
}
