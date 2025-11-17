import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { Transaction } from "@/server/db/Transaction";
import { IndicateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurRepository";
import { UtilisateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/UtilisateurRepository";
import { EnvoieEmailService } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/EnvoieEmailService";
import { formaterDate } from "@/client/utils/date/date";

export class RefuserPropositionValeurAvancementUseCase {
  private readonly indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;

  private readonly indicateurRepository: IndicateurRepository;

  private readonly utilisateurRepository: UtilisateurRepository;

  private readonly transaction: Transaction;

  private readonly envoieEmailService: EnvoieEmailService;

  constructor({
    indicateurTerritoireValeurEvenementRepository,
    indicateurRepository,
    utilisateurRepository,
    transaction,
    envoieEmailService,
  }: {
    indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
    indicateurRepository: IndicateurRepository;
    utilisateurRepository: UtilisateurRepository;
    transaction: Transaction;
    envoieEmailService: EnvoieEmailService;
  }) {
    this.indicateurTerritoireValeurEvenementRepository =
      indicateurTerritoireValeurEvenementRepository;
    this.indicateurRepository = indicateurRepository;
    this.utilisateurRepository = utilisateurRepository;
    this.transaction = transaction;
    this.envoieEmailService = envoieEmailService;
  }

  async run({
    indicId,
    territoireCode,
    dateValeurAvancement,
    idAuteurRefus,
    motif,
  }: {
    indicId: string;
    territoireCode: string;
    dateValeurAvancement: string;
    idAuteurRefus: string;
    motif: string;
  }) {
    const evenementsSurDate =
      await this.indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDate(
        {
          indicId,
          territoireCode,
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: new Date(dateValeurAvancement),
        },
      );

    const evenement = evenementsSurDate.creerEvenementPropositionValeurRefusee({
      auteurId: idAuteurRefus,
      motif,
    });

    await this.transaction.run(async () => {
      await this.indicateurRepository.supprimerTauxAvancementProposition({
        indicId: indicId,
        territoireCode: territoireCode,
      });
      await this.indicateurTerritoireValeurEvenementRepository.enregistrerTous([
        evenement,
      ]);
    });

    const auteursIdsProposition = evenementsSurDate
      .evenementsPropositionValeurCreeeOuModifiee()
      .map((proposition) => proposition.idAuteurModification);

    const emailsAuteurs =
      await this.utilisateurRepository.recupererEmailsParUtilisateurIds(
        auteursIdsProposition,
      );

    const emailsCoordinateurs =
      await this.utilisateurRepository.recupererUtilisateursParProfilEtTerritoire(
        {
          profil: territoireCode.startsWith("REG-")
            ? "COORDINATEUR_REGION"
            : "COORDINATEUR_DEPARTEMENT",
          territoireCode,
        },
      );

    const informationIndicateur =
      await this.indicateurRepository.recupererInformationIndicateur(indicId);

    for (const emailDestinataire of [
      ...emailsAuteurs,
      ...emailsCoordinateurs,
    ]) {
      await this.envoieEmailService.envoieNotificationProposition<"PROPOSITION_VALEUR_REFUSEE">(
        {
          destinataires: [{ email: emailDestinataire }],
          templateId: 42,
          parametres: {
            id_chantier: informationIndicateur!.chantierId,
            nom_chantier: informationIndicateur!.chantierNom,
            id_indicateur: indicId,
            nom_indicateur: informationIndicateur!.nom,
            date_pva: formaterDate(
              new Date(evenement.dateValeur).toISOString(),
              "MM-YYYY",
            )!,
            va_actuelle: evenementsSurDate.valeurEnCours(),
            va_proposee: evenement.valeur,
            motif_refus: evenement.donneesComplementaires?.motif ?? "",
          },
        },
      );
    }
  }
}
