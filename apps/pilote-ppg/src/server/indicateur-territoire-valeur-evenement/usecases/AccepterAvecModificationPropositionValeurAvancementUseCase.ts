import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { Transaction } from "@/server/db/Transaction";
import { MesureIndicateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/MesureIndicateurRepository";
import { UtilisateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/UtilisateurRepository";
import { IndicateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurRepository";
import { EnvoieEmailService } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/EnvoieEmailService";
import type { Inject } from "@/server/indicateur-territoire-valeur-evenement/module";
import { formaterDate } from "@/client/utils/date/date";
import { formaterNombre } from "@/client/utils/nombre/nombre";
import { EvenementsSurDate } from "@/server/import-indicateur/domain/EvenementsSurDate";
import { ValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { TypeEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/TypeEvenement";

export class AccepterAvecModificationPropositionValeurAvancementUseCase {
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
  }: Inject<
    | "indicateurTerritoireValeurEvenementRepository"
    | "mesureIndicateurRepository"
    | "utilisateurRepository"
    | "indicateurRepository"
    | "envoieEmailService"
    | "transaction"
  >) {
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
    valeur,
    motif,
  }: {
    indicId: string;
    territoireCode: string;
    dateValeurAvancement: string;
    idAuteurAcceptation: string;
    valeur: number;
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

    const valeurPropositionAvantAcceptation =
      evenementsSurDate.evenementPropositionValeurEnCours()?.valeur;
    const valeurAvancementAvantAcceptation = evenementsSurDate.valeurEnCours();

    const evenements =
      evenementsSurDate.creerEvenementPropositionValeurAccepteeAvecModification(
        {
          auteurId: idAuteurAcceptation,
          valeur,
          motif,
        },
      );

    await this.transaction.run(async () => {
      await this.mesureIndicateurRepository.enregistrer({
        auteurId: idAuteurAcceptation,
        indicId,
        territoireCode,
        dateValeur: new Date(dateValeurAvancement),
        valeur: valeur.toString(),
      });
      await this.indicateurTerritoireValeurEvenementRepository.enregistrerTous(
        evenements,
      );
    });

    this.EnvoieNotification({
      evenementsSurDate,
      territoireCode,
      indicId,
      dateValeurAvancement,
      valeurAvancementAvantAcceptation,
      valeurPropositionAvantAcceptation,
      valeurAcceptee: valeur,
      motif,
    }).catch();
  }

  private async EnvoieNotification({
    evenementsSurDate,
    territoireCode,
    indicId,
    dateValeurAvancement,
    valeurAvancementAvantAcceptation,
    valeurPropositionAvantAcceptation,
    valeurAcceptee,
    motif,
  }: {
    evenementsSurDate: EvenementsSurDate;
    territoireCode: string;
    indicId: string;
    dateValeurAvancement: string;
    valeurAvancementAvantAcceptation: ValeurEvenement<TypeEvenement>;
    valeurPropositionAvantAcceptation:
      | ValeurEvenement<TypeEvenement>
      | undefined;
    valeurAcceptee: number;
    motif: string;
  }): Promise<void> {
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

    const emailsDestinatairesUniques = [
      ...new Set([...emailsAuteurs, ...emailsCoordinateurs]),
    ];

    for (const emailDestinataire of emailsDestinatairesUniques) {
      await this.envoieEmailService.envoieNotificationProposition<"PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION">(
        {
          destinataires: [{ email: emailDestinataire }],
          templateId: 41,
          parametres: {
            chantierId: informationIndicateur!.chantierId,
            chantierNom: informationIndicateur!.chantierNom,
            indicateurId: indicId,
            indicateurNom: informationIndicateur!.nom,
            dateValeur: formaterDate(
              new Date(dateValeurAvancement).toISOString(),
              "MM-YYYY",
            )!,
            valeurAvancement: formaterNombre(
              valeurAvancementAvantAcceptation,
              1,
            ),
            valeurProposee: formaterNombre(
              valeurPropositionAvantAcceptation,
              1,
            ),
            valeurAcceptee: formaterNombre(valeurAcceptee, 1),
            motifModification: motif,
          },
        },
      );
    }
  }
}
