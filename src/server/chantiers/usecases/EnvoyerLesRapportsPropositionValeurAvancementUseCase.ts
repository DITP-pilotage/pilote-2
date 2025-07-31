import { PropositionValeurAvancementRepository } from "@/server/chantiers/domain/ports/PropositionValeurAvancementRepository";
import { ChantierRepository } from "@/server/chantiers/domain/ports/ChantierRepository";
import { EnvoieEmailService } from "@/server/chantiers/domain/ports/EnvoieEmailService";
import { UtilisateurRepository } from "@/server/chantiers/domain/ports/UtilisateurRepository";
import { genererParametresEnvoieRapportProposition } from "@/server/chantiers/app/contrats/ParametresEnvoieEmailRapportProposition";

interface Dependencies {
  propositionValeurAvancementRepository: PropositionValeurAvancementRepository;
  chantierRepository: ChantierRepository;
  utilisateurRepository: UtilisateurRepository;
  envoieEmailService: EnvoieEmailService;
}

export class EnvoyerLesRapportsPropositionValeurAvancementUseCase {
  private propositionValeurAvancementRepository: PropositionValeurAvancementRepository;

  private chantierRepository: ChantierRepository;

  private utilisateurRepository: UtilisateurRepository;

  private envoieEmailService: EnvoieEmailService;

  constructor({
    propositionValeurAvancementRepository,
    chantierRepository,
    utilisateurRepository,
    envoieEmailService,
  }: Dependencies) {
    this.propositionValeurAvancementRepository =
      propositionValeurAvancementRepository;
    this.chantierRepository = chantierRepository;
    this.utilisateurRepository = utilisateurRepository;
    this.envoieEmailService = envoieEmailService;
  }

  async run(): Promise<{ emailsEnEchec: string[] }> {
    const listeChantiersIdsAvecProposition =
      await this.propositionValeurAvancementRepository.recupererLaListeDesChantiersIdsAvecPropositionEnCours();
    const listeDirecteursDeProjet =
      await this.utilisateurRepository.recupererUtilisateursParProfilEtChantierIds(
        "EQUIPE_DIR_PROJET",
        listeChantiersIdsAvecProposition,
      );

    const listeChantiersProposition =
      await this.chantierRepository.recupererListePropositionValeurAvancementChantierInformationParChantiersIds(
        { listeChantiersIds: listeChantiersIdsAvecProposition },
      );
    const propositionsParChantier =
      await this.propositionValeurAvancementRepository.recupererLesPropositionsEnCoursParChantierIds();

    const mapChantiersPropositionInformation = new Map(
      listeChantiersProposition.map((chantier) => [chantier.id, chantier]),
    );

    const emailsEnEchec: string[] = [];

    for (const directeur of listeDirecteursDeProjet) {
      try {
        const { chantiers, conseillerEmail } =
          genererParametresEnvoieRapportProposition(
            directeur.listeChantiers,
            mapChantiersPropositionInformation,
            propositionsParChantier,
          );
        await this.envoieEmailService.envoieUnEmail(
          [{ email: directeur.email }],
          4,
          { chantiers, conseiller_email: conseillerEmail },
        );
      } catch {
        emailsEnEchec.push(directeur.email);
      }
    }
    return { emailsEnEchec };
  }
}
