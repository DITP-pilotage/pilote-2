import { ChantierRepository } from "@/server/chantiers/domain/ports/ChantierRepository";
import { EnvoieEmailService } from "@/server/chantiers/domain/ports/EnvoieEmailService";
import { UtilisateurRepository } from "@/server/chantiers/domain/ports/UtilisateurRepository";
import { genererParametresEnvoieRapportProposition } from "@/server/chantiers/app/contrats/ParametresEnvoieEmailRapportProposition";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { IndicateurRepository } from "@/server/chantiers/domain/ports/IndicateurRepository";

interface Dependencies {
  chantierRepository: ChantierRepository;
  utilisateurRepository: UtilisateurRepository;
  envoieEmailService: EnvoieEmailService;
  indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
  indicateurRepository: IndicateurRepository;
}

export class EnvoyerLesRapportsPropositionValeurAvancementUseCase {
  private chantierRepository: ChantierRepository;

  private utilisateurRepository: UtilisateurRepository;

  private envoieEmailService: EnvoieEmailService;

  private indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;

  private indicateurRepository: IndicateurRepository;

  constructor({
    chantierRepository,
    utilisateurRepository,
    envoieEmailService,
    indicateurTerritoireValeurEvenementRepository,
    indicateurRepository,
  }: Dependencies) {
    this.chantierRepository = chantierRepository;
    this.utilisateurRepository = utilisateurRepository;
    this.envoieEmailService = envoieEmailService;
    this.indicateurTerritoireValeurEvenementRepository =
      indicateurTerritoireValeurEvenementRepository;
    this.indicateurRepository = indicateurRepository;
  }

  async run(): Promise<{ emailsEnEchec: string[] }> {
    const propositionsParChantier =
      await this.indicateurTerritoireValeurEvenementRepository.recupererLesPropositionsEnCoursParChantierIds();

    const indicateursNonAJourParChantier =
      await this.indicateurRepository.recupererIndicateursNonAJourParChantierId();

    const listeChantiersIdsRapport = [
      ...new Set([
        ...propositionsParChantier.keys(),
        ...indicateursNonAJourParChantier.keys(),
      ]),
    ];

    const listeDirecteursDeProjet =
      await this.utilisateurRepository.recupererUtilisateursParProfilEtChantierIds(
        "EQUIPE_DIR_PROJET",
        listeChantiersIdsRapport,
      );

    const listeChantiersProposition =
      await this.chantierRepository.recupererListePropositionValeurAvancementChantierInformationParChantiersIds(
        { listeChantiersIds: listeChantiersIdsRapport },
      );

    const mapChantiersPropositionInformation = new Map(
      listeChantiersProposition.map((chantier) => [chantier.id, chantier]),
    );

    const emailsEnEchec: string[] = [];

    const tmp = [
      listeDirecteursDeProjet[0],
      listeDirecteursDeProjet[1],
      listeDirecteursDeProjet[listeDirecteursDeProjet.length - 1],
    ];

    for (const directeur of tmp) {
      try {
        const { chantiers, conseillerEmail } =
          genererParametresEnvoieRapportProposition(
            directeur.listeChantiers,
            mapChantiersPropositionInformation,
            propositionsParChantier,
            indicateursNonAJourParChantier,
          );
        await this.envoieEmailService.envoieUnEmail(
          [{ email: "tconti34@gmail.com" }],
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
