import groupBy from "lodash.groupby";
import { randomUUID } from "node:crypto";
import { MesureIndicateurRepository } from "@/server/import-indicateur/domain/ports/MesureIndicateurRepository.interface";

import { RapportRepository } from "@/server/import-indicateur/domain/ports/RapportRepository";
import { MesureIndicateurTemporaireRepository } from "@/server/import-indicateur/domain/ports/MesureIndicateurTemporaireRepository.interface";
import { IndicateurData } from "@/server/import-indicateur/domain/IndicateurData";
import { PropositionValeurAvancementRepository } from "@/server/import-indicateur/domain/ports/PropositionValeurAvancementRepository";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/import-indicateur/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { ValeurIndicateurTerritoireEvenement } from "@/server/import-indicateur/domain/ValeurIndicateurTerritoireEvenement";
import { convertirZoneIdEnTerritoireCode } from "@/server/app/domain/Territoire";

interface Dependencies {
  mesureIndicateurTemporaireRepository: MesureIndicateurTemporaireRepository;
  mesureIndicateurRepository: MesureIndicateurRepository;
  rapportRepository: RapportRepository;
  propositionValeurAvancementRepository: PropositionValeurAvancementRepository;
  indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
}

export class PublierFichierIndicateurImporteUseCase {
  private mesureIndicateurTemporaireRepository: MesureIndicateurTemporaireRepository;

  private mesureIndicateurRepository: MesureIndicateurRepository;

  private propositionValeurAvancementRepository: PropositionValeurAvancementRepository;

  private indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;

  constructor({
    mesureIndicateurTemporaireRepository,
    mesureIndicateurRepository,
    propositionValeurAvancementRepository,
    indicateurTerritoireValeurEvenementRepository,
  }: Dependencies) {
    this.mesureIndicateurTemporaireRepository =
      mesureIndicateurTemporaireRepository;
    this.mesureIndicateurRepository = mesureIndicateurRepository;
    this.propositionValeurAvancementRepository =
      propositionValeurAvancementRepository;
    this.indicateurTerritoireValeurEvenementRepository =
      indicateurTerritoireValeurEvenementRepository;
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

    const listeValeursAvancementImportees = listeIndicateursData.filter(
      (indicateur) => indicateur.metricType === "va",
    );
    await this.mesureIndicateurRepository.sauvegarder(listeIndicateursData);
    await this.creerValeurIndicateurTerritoireEvenements(
      listeIndicateursData,
      auteurId,
    );

    await Promise.all(
      listeValeursAvancementImportees.map((valeurAvancement) =>
        this.propositionValeurAvancementRepository.modifierStatutPropositionsValeurAvancementApresImport(
          {
            indicId: valeurAvancement.indicId,
            zoneId: valeurAvancement.zoneId,
            dateValeurImportee: new Date(valeurAvancement.metricDate),
            valeurImportee: Number.parseFloat(valeurAvancement.metricValue),
          },
        ),
      ),
    );
    await this.mesureIndicateurTemporaireRepository.supprimerToutParRapportId(
      rapportId,
    );
  }

  private async creerValeurIndicateurTerritoireEvenements(
    listeIndicateursData: IndicateurData[],
    auteurId: string,
  ) {
    const evenements: ValeurIndicateurTerritoireEvenement[] = [];

    // Filtrer les indicateurs de type "va" et les grouper par [indicId, territoireCode]
    const indicateursVA = listeIndicateursData.filter(
      (indicateur) => indicateur.metricType === "va",
    );

    const indicateursGroupes = groupBy(
      indicateursVA,
      (indicateur) =>
        `${indicateur.indicId}-${convertirZoneIdEnTerritoireCode(indicateur.zoneId)}`,
    );

    // Traiter chaque groupe d'indicateurs avec un stream d'événements en mémoire
    for (const [, indicateurs] of Object.entries(indicateursGroupes)) {
      const premierIndicateur = indicateurs[0];
      const territoireCode = convertirZoneIdEnTerritoireCode(
        premierIndicateur.zoneId,
      );

      // Récupérer les événements existants une seule fois par groupe
      const evenementsInitiaux =
        await this.indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeEtTypeValeur(
          {
            territoireCode,
            indicId: premierIndicateur.indicId,
            typeValeur: "VALEUR_AVANCEMENT",
          },
        );

      // Maintenir un stream d'événements en mémoire pour ce groupe
      let evenementsEnMemoire = [...evenementsInitiaux];

      // Trier les indicateurs par date pour un traitement chronologique
      const indicateursTriesParDate = indicateurs.sort((a, b) =>
        a.metricDate.localeCompare(b.metricDate),
      );

      for (const indicateurData of indicateursTriesParDate) {
        const nouveauxEvenements = this.traiterIndicateur(
          indicateurData,
          evenementsEnMemoire,
          territoireCode,
          auteurId,
        );

        // Ajouter les nouveaux événements au stream en mémoire et à la liste finale
        evenementsEnMemoire.unshift(...[...nouveauxEvenements].reverse());
        evenements.push(...nouveauxEvenements);
      }
    }

    await this.indicateurTerritoireValeurEvenementRepository.enregistrerTous(
      evenements,
    );
  }

  private traiterIndicateur(
    indicateurData: IndicateurData,
    evenementsEnMemoire: ValeurIndicateurTerritoireEvenement[],
    territoireCode: string,
    auteurId: string,
  ): ValeurIndicateurTerritoireEvenement[] {
    const nouveauxEvenements: ValeurIndicateurTerritoireEvenement[] = [];
    const evenementsExistantParDate = groupBy(
      evenementsEnMemoire,
      (evenement) => evenement.dateValeur.toISOString().split("T")[0],
    );

    let doitHistoriserValeurCreee = false;
    let doitModifierValeurCreee = false;
    let doitIgnorer = false;

    for (const [date, evenementsPourDate] of Object.entries(
      evenementsExistantParDate,
    )) {
      if (date > indicateurData.metricDate) {
        doitHistoriserValeurCreee = true;
        continue;
      }
      if (date === indicateurData.metricDate) {
        doitModifierValeurCreee = true;
        doitIgnorer =
          Number.parseFloat(indicateurData.metricValue) ===
          evenementsPourDate[0].valeur;
        continue;
      }
      const estHistorise = evenementsPourDate.some(
        (evenement) => evenement.typeEvenement === "VALEUR_HISTORISEE",
      );
      if (!estHistorise) {
        nouveauxEvenements.push(
          ValeurIndicateurTerritoireEvenement.createValeurIndicateurTerritoireEvenement(
            {
              indicId: indicateurData.indicId,
              territoireCode,
              typeEvenement: "VALEUR_HISTORISEE",
              typeValeur: "VALEUR_AVANCEMENT",
              dateValeur: evenementsPourDate[0].dateValeur,
              valeur: evenementsPourDate[0].valeur,
              donneesComplementaires: {},
              idAuteurModification: auteurId,
              correlationId: randomUUID(),
            },
          ),
        );
      }
    }

    if (doitIgnorer) return nouveauxEvenements;

    nouveauxEvenements.push(
      ValeurIndicateurTerritoireEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: indicateurData.indicId,
          territoireCode,
          typeEvenement: doitModifierValeurCreee
            ? "VALEUR_MODIFIEE"
            : "VALEUR_CREEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: new Date(indicateurData.metricDate),
          valeur: Number.parseFloat(indicateurData.metricValue),
          donneesComplementaires: {},
          idAuteurModification: auteurId,
          correlationId: randomUUID(),
        },
      ),
    );

    if (doitHistoriserValeurCreee) {
      nouveauxEvenements.push(
        ValeurIndicateurTerritoireEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: indicateurData.indicId,
            territoireCode,
            typeEvenement: "VALEUR_HISTORISEE",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: new Date(indicateurData.metricDate),
            valeur: Number.parseFloat(indicateurData.metricValue),
            donneesComplementaires: {},
            idAuteurModification: auteurId,
            correlationId: randomUUID(),
          },
        ),
      );
    }

    return nouveauxEvenements;
  }
}
