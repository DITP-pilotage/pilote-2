import groupBy from "lodash.groupby";
import { MesureIndicateurRepository } from "@/server/import-indicateur/domain/ports/MesureIndicateurRepository.interface";
import { MesureIndicateurTemporaireRepository } from "@/server/import-indicateur/domain/ports/MesureIndicateurTemporaireRepository.interface";
import { IndicateurData } from "@/server/import-indicateur/domain/IndicateurData";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { IndicateurTerritoireValeurEvenements } from "@/server/import-indicateur/domain/IndicateurTerritoireValeurEvenements";
import { convertirZoneIdEnTerritoireCode } from "@/server/app/domain/Territoire";
import { Transaction } from "@/server/db/Transaction";
import type { Inject } from "@/server/import-indicateur/module";

export class PublierFichierIndicateurImporteUseCase {
  private mesureIndicateurTemporaireRepository: MesureIndicateurTemporaireRepository;

  private mesureIndicateurRepository: MesureIndicateurRepository;

  private indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;

  private transaction: Transaction;

  constructor({
    mesureIndicateurTemporaireRepository,
    mesureIndicateurRepository,
    indicateurTerritoireValeurEvenementRepository,
    transaction,
  }: Inject<
    | "mesureIndicateurTemporaireRepository"
    | "mesureIndicateurRepository"
    | "indicateurTerritoireValeurEvenementRepository"
    | "transaction"
  >) {
    this.mesureIndicateurTemporaireRepository =
      mesureIndicateurTemporaireRepository;
    this.mesureIndicateurRepository = mesureIndicateurRepository;
    this.indicateurTerritoireValeurEvenementRepository =
      indicateurTerritoireValeurEvenementRepository;
    this.transaction = transaction;
  }

  async execute({
    rapportId,
    auteurId,
  }: {
    rapportId: string;
    auteurId: string;
  }): Promise<void> {
    const listeMesuresIndicateurTemporaire =
      await this.mesureIndicateurTemporaireRepository.recupererToutParRapportId(
        rapportId,
      );

    const listeIndicateursData = listeMesuresIndicateurTemporaire.map(
      (mesureIndicateurTemporaire) =>
        // En arrivant ici on a déjà vérifié les valeurs par validata, on est donc sur que les valeurs sont présentes d'où le as string
        // TODO: Pour plus de clarté on pourrait créer un nouveau type MesureIndicateurTemporaireVerifie avec des valeurs figés à string
        IndicateurData.createIndicateurData({
          rapportId: mesureIndicateurTemporaire.rapportId,
          zoneId: mesureIndicateurTemporaire.zoneId as string,
          indicId: mesureIndicateurTemporaire.indicId as string,
          metricType: mesureIndicateurTemporaire.metricType as string,
          metricDate: mesureIndicateurTemporaire.metricDate as string,
          metricValue: mesureIndicateurTemporaire.metricValue as string,
        }),
    );

    const evenements = await this.creerValeurIndicateurTerritoireEvenements(
      listeIndicateursData,
      auteurId,
    );

    await this.transaction.run(async () => {
      await this.mesureIndicateurRepository.sauvegarder(listeIndicateursData);
      await this.indicateurTerritoireValeurEvenementRepository.enregistrerTous(
        evenements,
      );
      await this.mesureIndicateurTemporaireRepository.supprimerToutParRapportId(
        rapportId,
      );
    });
  }

  private async creerValeurIndicateurTerritoireEvenements(
    listeIndicateursData: IndicateurData[],
    auteurId: string,
  ) {
    const evenements: IndicateurTerritoireValeurEvenement[] = [];

    // Filtrer les indicateurs de type "va" et les grouper par [indicId, territoireCode]
    const indicateursVA = listeIndicateursData.filter(
      (indicateur) => indicateur.metricType === "va",
    );

    const indicateursGroupes = groupBy(
      indicateursVA,
      (indicateur) =>
        `${indicateur.indicId}-${convertirZoneIdEnTerritoireCode(indicateur.zoneId)}`,
    );

    // Traiter chaque groupe d'indicateurs avec la nouvelle classe domaine
    for (const [, indicateurs] of Object.entries(indicateursGroupes)) {
      const premierIndicateur = indicateurs[0];
      const territoireCode = convertirZoneIdEnTerritoireCode(
        premierIndicateur.zoneId,
      );

      // TODO(PVA/JOTA/2025-08-18): Pousser cette récupération dans les repositories
      // Récupérer les événements existants une seule fois par groupe
      const evenementsInitiaux =
        await this.indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeEtTypeValeur(
          {
            territoireCode,
            indicId: premierIndicateur.indicId,
            typeValeur: "VALEUR_AVANCEMENT",
          },
        );

      // Créer une instance de la classe domaine pour ce groupe
      const indicateurTerritoireEvenements =
        new IndicateurTerritoireValeurEvenements({
          indicId: premierIndicateur.indicId,
          territoireCode,
          evenementsInitiaux,
        });

      // Traiter chaque indicateur avec la classe domaine
      for (const indicateurData of indicateurs) {
        const nouveauxEvenements =
          indicateurTerritoireEvenements.ingererIndicateurData(
            indicateurData,
            auteurId,
          );
        evenements.push(...nouveauxEvenements);
      }
    }

    return evenements;
  }
}
