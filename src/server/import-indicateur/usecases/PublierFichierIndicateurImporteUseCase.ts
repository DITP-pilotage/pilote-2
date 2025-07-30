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

  async execute({ rapportId }: { rapportId: string }): Promise<void> {
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

    const evenements: ValeurIndicateurTerritoireEvenement[] = [];
    for (let indicateurData of listeIndicateursData) {
      let typeValeur = indicateurData.metricType;
      if (typeValeur !== "va") {
        // TODO : gérer les autres types de valeur
        continue;
      }
      evenements.push(
        ValeurIndicateurTerritoireEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: indicateurData.indicId,
            territoireCode: convertirZoneIdEnTerritoireCode(
              indicateurData.zoneId,
            ),
            typeEvenement: "VALEUR_CREEE",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: new Date(indicateurData.metricDate),
            donneesComplementaires: {},
            idAuteurModification: "system", // TODO - récupérer l'auteur depuis le rapport
            correlationId: randomUUID(),
          },
        ),
      );
    }
    await this.mesureIndicateurRepository.sauvegarder(listeIndicateursData);
    await this.indicateurTerritoireValeurEvenementRepository.enregistrerTous(
      evenements,
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
}
