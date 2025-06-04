import { PropositionValeurActuelleRepository } from '@/server/chantiers/domain/ports/PropositionValeurActuelleRepository';
import { ChantierRepository } from '@/server/chantiers/domain/ports/ChantierRepository';
import { EnvoieEmailService } from '@/server/chantiers/domain/ports/EnvoieEmailService';
import { UtilisateurRepository } from '@/server/chantiers/domain/ports/UtilisateurRepository';
import { genererParametresEnvoieRapportProposition } from '@/server/chantiers/app/contrats/ParametresEnvoieEmailRapportProposition';

interface Dependencies {
  propositionValeurActuelleRepository: PropositionValeurActuelleRepository;
  chantierRepository: ChantierRepository;
  utilisateurRepository: UtilisateurRepository;
  envoieEmailService: EnvoieEmailService;
}

export class EnvoyerLesRapportsPropositionValeurAvancementUseCase {

  private propositionValeurActuelleRepository: PropositionValeurActuelleRepository;
  
  private chantierRepository: ChantierRepository;
  
  private utilisateurRepository: UtilisateurRepository;

  private envoieEmailService: EnvoieEmailService;

  constructor({ 
    propositionValeurActuelleRepository, 
    chantierRepository,
    utilisateurRepository,
    envoieEmailService,
  }: Dependencies) {
    this.propositionValeurActuelleRepository = propositionValeurActuelleRepository;
    this.chantierRepository = chantierRepository;
    this.utilisateurRepository = utilisateurRepository;
    this.envoieEmailService = envoieEmailService;
  }

  async run(): Promise<void> {
    const listeChantiersIdsAvecProposition = await this.propositionValeurActuelleRepository.recupererLaListeDesChantiersIdsAvecPropositionEnCours();
    const listeDirecteursDeProjet = await this.utilisateurRepository.recupererUtilisateursParProfilEtChantierIds('EQUIPE_DIR_PROJET', listeChantiersIdsAvecProposition);
  
    const listeChantiersProposition = await this.chantierRepository.recupererListePropositionValeurAvancementChantierInformationParChantiersIds({ listeChantiersIds: listeChantiersIdsAvecProposition });
    const propositionsParChantier = await this.propositionValeurActuelleRepository.recupererLesPropositionsEnCoursParChantierIds();
    
    const mapChantiersPropositionInformation = new Map(listeChantiersProposition.map(chantier => [chantier.id, chantier]));

    for (const directeur of listeDirecteursDeProjet) {
      const { chantiers, conseillerEmail } = genererParametresEnvoieRapportProposition(directeur.listeChantiers, mapChantiersPropositionInformation, propositionsParChantier);
      this.envoieEmailService.envoieUnEmail([{ email: directeur.email }], 4, { chantiers: chantiers, conseiller_email: conseillerEmail });      
    }

  }
}
