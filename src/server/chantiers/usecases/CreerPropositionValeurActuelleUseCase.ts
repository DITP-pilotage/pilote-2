import {
  PropositionValeurActuelleRepository,
} from '@/server/chantiers/domain/ports/PropositionValeurActuelleRepository';
import { PropositionValeurActuelle } from '@/server/chantiers/domain/PropositionValeurActuelle';

interface Dependencies {
  propositionValeurActuelleRepository: PropositionValeurActuelleRepository
}

export class CreerPropositionValeurActuelleUseCase {
  private propositionValeurActuelleRepository: PropositionValeurActuelleRepository;
  
  constructor({ propositionValeurActuelleRepository }: Dependencies) {
    this.propositionValeurActuelleRepository = propositionValeurActuelleRepository;
  }

  async run({
    indicId,
    valeurActuelleProposee,
    territoireCode,
    dateValeurActuelle,
    idAuteurModification,
    auteurModification,
    dateProposition,
    motifProposition,
    sourceDonneeEtMethodeCalcul,
    statut,
  }: {
    indicId: string,
    valeurActuelleProposee: number,
    territoireCode: string,
    dateValeurActuelle: Date,
    idAuteurModification: string,
    auteurModification: string,
    dateProposition: Date,
    motifProposition: string,
    sourceDonneeEtMethodeCalcul: string,
    statut: string
  }) {
    const propositionValeurActuelle = PropositionValeurActuelle.creerPropositionValeurActuelle({
      indicId,
      valeurActuelleProposee,
      territoireCode,
      dateValeurActuelle,
      idAuteurModification,
      auteurModification,
      dateProposition,
      motifProposition,
      sourceDonneeEtMethodeCalcul,
      statut,
    });
    await this.propositionValeurActuelleRepository.creerPropositionValeurActuelle(propositionValeurActuelle);
  }
}

