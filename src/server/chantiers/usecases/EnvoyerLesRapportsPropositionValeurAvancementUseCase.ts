import { ChantierRepository } from "@/server/chantiers/domain/ports/ChantierRepository";
import { EnvoieEmailService } from "@/server/chantiers/domain/ports/EnvoieEmailService";
import { UtilisateurRepository } from "@/server/chantiers/domain/ports/UtilisateurRepository";
import { genererParametresEnvoieRapportProposition } from "@/server/chantiers/app/contrats/ParametresEnvoieEmailRapportProposition";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";

interface Dependencies {
  chantierRepository: ChantierRepository;
  utilisateurRepository: UtilisateurRepository;
  envoieEmailService: EnvoieEmailService;
  indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
}

export class EnvoyerLesRapportsPropositionValeurAvancementUseCase {
  private chantierRepository: ChantierRepository;

  private utilisateurRepository: UtilisateurRepository;

  private envoieEmailService: EnvoieEmailService;

  private indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;

  constructor({
    chantierRepository,
    utilisateurRepository,
    envoieEmailService,
    indicateurTerritoireValeurEvenementRepository,
  }: Dependencies) {
    this.chantierRepository = chantierRepository;
    this.utilisateurRepository = utilisateurRepository;
    this.envoieEmailService = envoieEmailService;
    this.indicateurTerritoireValeurEvenementRepository =
      indicateurTerritoireValeurEvenementRepository;
  }

  async run(): Promise<{ emailsEnEchec: string[] }> {
    const propositionsParChantier =
      await this.indicateurTerritoireValeurEvenementRepository.recupererLesPropositionsEnCoursParChantierIds();

    const listeChantiersIdsAvecProposition = [
      ...propositionsParChantier.keys(),
    ];
    const listeDirecteursDeProjet =
      await this.utilisateurRepository.recupererUtilisateursParProfilEtChantierIds(
        "EQUIPE_DIR_PROJET",
        listeChantiersIdsAvecProposition,
      );

    const listeChantiersProposition =
      await this.chantierRepository.recupererListePropositionValeurAvancementChantierInformationParChantiersIds(
        { listeChantiersIds: listeChantiersIdsAvecProposition },
      );

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
