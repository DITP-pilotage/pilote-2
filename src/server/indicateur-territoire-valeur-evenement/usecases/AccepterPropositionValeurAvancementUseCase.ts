import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { Transaction } from "@/server/db/Transaction";
import { MesureIndicateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/MesureIndicateurRepository";
import { UtilisateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/UtilisateurRepository";
import { IndicateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurRepository";
import { EnvoieEmailService } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/EnvoieEmailService";
import { formaterDate } from "@/client/utils/date/date";

export class AccepterPropositionValeurAvancementUseCase {
  private readonly indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;

  private readonly mesureIndicateurRepository: MesureIndicateurRepository;

  private readonly utilisateurRepository: UtilisateurRepository;

  private readonly indicateurRepository: IndicateurRepository;

  private readonly envoieEmailService: EnvoieEmailService;

  private readonly transaction: Transaction;

  constructor({
    indicateurTerritoireValeurEvenementRepository,
    mesureIndicateurRepository,
    utilisateurRepository,
    indicateurRepository,
    envoieEmailService,
    transaction,
  }: {
    indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
    mesureIndicateurRepository: MesureIndicateurRepository;
    utilisateurRepository: UtilisateurRepository;
    indicateurRepository: IndicateurRepository;
    envoieEmailService: EnvoieEmailService;
    transaction: Transaction;
  }) {
    this.indicateurTerritoireValeurEvenementRepository =
      indicateurTerritoireValeurEvenementRepository;
    this.mesureIndicateurRepository = mesureIndicateurRepository;
    this.utilisateurRepository = utilisateurRepository;
    this.indicateurRepository = indicateurRepository;
    this.envoieEmailService = envoieEmailService;
    this.transaction = transaction;
  }

  async run({
    indicId,
    territoireCode,
    dateValeurAvancement,
    idAuteurAcceptation,
    motif,
  }: {
    indicId: string;
    territoireCode: string;
    dateValeurAvancement: string;
    idAuteurAcceptation: string;
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

    const valeurAvancementAvantAcceptation = evenementsSurDate.valeurEnCours();
    const evenements =
      evenementsSurDate.creerEvenementPropositionValeurAcceptee({
        auteurId: idAuteurAcceptation,
        motif,
      });

    const valeurEnCours = evenementsSurDate.valeurEnCours();

    await this.transaction.run(async () => {
      await this.mesureIndicateurRepository.enregistrer({
        auteurId: idAuteurAcceptation,
        indicId,
        territoireCode,
        dateValeur: new Date(dateValeurAvancement),
        valeur: valeurEnCours === null ? "" : valeurEnCours.toString(),
      });
      await this.indicateurTerritoireValeurEvenementRepository.enregistrerTous(
        evenements,
      );
    });

    const auteursIdsProposition = evenementsSurDate
      .evenementsPropositionValeurCreeeOuModifiee()
      .map((proposition) => proposition.idAuteurModification);

    const emailsAuteurs =
      await this.utilisateurRepository.recupererEmailsParUtilisateurIds(
        auteursIdsProposition,
      );

    const profilCoordinateur = territoireCode.startsWith("REG-")
      ? "COORDINATEUR_REGION"
      : "COORDINATEUR_DEPARTEMENT";

    const emailsCoordinateurs =
      await this.utilisateurRepository.recupererUtilisateursParProfilEtTerritoire(
        {
          profil: profilCoordinateur,
          territoireCode,
        },
      );

    const informationIndicateur =
      await this.indicateurRepository.recupererInformationIndicateur(indicId);

    for (const emailDestinataire of [
      ...emailsAuteurs,
      ...emailsCoordinateurs,
    ]) {
      await this.envoieEmailService.envoieNotificationProposition<"PROPOSITION_VALEUR_ACCEPTEE">(
        {
          destinataires: [{ email: emailDestinataire }],
          templateId: 40,
          parametres: {
            id_chantier: informationIndicateur!.chantierId,
            nom_chantier: informationIndicateur!.chantierNom,
            id_indicateur: indicId,
            nom_indicateur: informationIndicateur!.nom,
            date_pva: formaterDate(
              new Date(dateValeurAvancement).toISOString(),
              "MM-YYYY",
            )!,
            va_actuelle: valeurAvancementAvantAcceptation,
            va_proposee: evenementsSurDate.valeurEnCours(),
          },
        },
      );
    }
  }
}
