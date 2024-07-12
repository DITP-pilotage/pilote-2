import { StatutProposition } from '@/server/chantiers/domain/StatutProposition';
import { PropositionValeurActuelle } from '@/server/chantiers/domain/PropositionValeurActuelle';

export class PropositionValeurActuelleBuilder {
  private id: string = 'cb6e5af4-065a-4a82-8a49-be3dea248330';

  private indicId: string = 'IND-001';

  private valeurActuelleProposee: number = 12.3;

  private territoireCode: string = 'DEPT-01';

  private dateValeurActuelle: Date = new Date('2023-03-12');

  private idAuteurModification: string = 'b962181f-087c-442e-a899-dae59e3533cd';

  private auteurModification: string = 'john.doe@test.com';

  private dateProposition: Date = new Date();

  private motifProposition: string = 'Oublie de valeur';

  private sourceDonneeEtMethodeCalcul: string = 'Une source mieux que l\'ancienne';

  private statut: string = StatutProposition.EN_COURS;

  avecId(id: string): PropositionValeurActuelleBuilder {
    this.id = id;
    return this;
  }

  avecIndicId(indicId: string): PropositionValeurActuelleBuilder {
    this.indicId = indicId;
    return this;
  }

  avecValeurActuelleProposee(valeurActuelleProposee: number): PropositionValeurActuelleBuilder {
    this.valeurActuelleProposee = valeurActuelleProposee;
    return this;
  }

  avecTerritoireCode(territoireCode: string): PropositionValeurActuelleBuilder {
    this.territoireCode = territoireCode;
    return this;
  }

  avecDateValeurActuelle(dateValeurActuelle: Date): PropositionValeurActuelleBuilder {
    this.dateValeurActuelle = dateValeurActuelle;
    return this;
  }

  avecIdAuteurModification(idAuteurModification: string): PropositionValeurActuelleBuilder {
    this.idAuteurModification = idAuteurModification;
    return this;
  }

  avecAuteurModification(auteurModification: string): PropositionValeurActuelleBuilder {
    this.auteurModification = auteurModification;
    return this;
  }

  avecDateProposition(dateProposition: Date): PropositionValeurActuelleBuilder {
    this.dateProposition = dateProposition;
    return this;
  }

  avecMotifProposition(motifProposition: string): PropositionValeurActuelleBuilder {
    this.motifProposition = motifProposition;
    return this;
  }

  avecSourceDonneeEtMethodeCalcul(sourceDonneeEtMethodeCalcul: string): PropositionValeurActuelleBuilder {
    this.sourceDonneeEtMethodeCalcul = sourceDonneeEtMethodeCalcul;
    return this;
  }

  avecStatut(statut: string): PropositionValeurActuelleBuilder {
    this.statut = statut;
    return this;
  }

  build(): PropositionValeurActuelle {
    return PropositionValeurActuelle.creerPropositionValeurActuelle({
      id: this.id,
      indicId: this.indicId,
      valeurActuelleProposee: this.valeurActuelleProposee,
      territoireCode: this.territoireCode,
      dateValeurActuelle: this.dateValeurActuelle,
      idAuteurModification: this.idAuteurModification,
      auteurModification: this.auteurModification,
      dateProposition: this.dateProposition,
      motifProposition: this.motifProposition,
      sourceDonneeEtMethodeCalcul: this.sourceDonneeEtMethodeCalcul,
      statut: this.statut,
    });
  }
}
