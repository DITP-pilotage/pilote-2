import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { Transaction } from "@/server/db/Transaction";
import { IndicateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurRepository";
import { UtilisateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/UtilisateurRepository";
import { EnvoieEmailService } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/EnvoieEmailService";
import { formaterDate } from "@/client/utils/date/date";
import { formaterNombre } from "@/client/utils/nombre/nombre";

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
            chantierId: informationIndicateur!.chantierId,
            chantierNom: informationIndicateur!.chantierNom,
            indicateurId: indicId,
            indicateurNom: informationIndicateur!.nom,
            dateValeur: formaterDate(
              new Date(evenement.dateValeur).toISOString(),
              "MM-YYYY",
            )!,
            valeurAvancement: formaterNombre(
              evenementsSurDate.valeurEnCours(),
              1,
            ),
            valeurProposee: formaterNombre(evenement.valeur, 1),
            motifRefus: evenement.donneesComplementaires?.motif ?? "",
          },
        },
      );
    }
  }
}
